import * as Tone from 'tone';
import type { FMSynthParams } from '../engine/types';

/**
 * Advanced 6-Oscillator Drum Synthesis Engine
 * Supports Skin (additive), Liquid (pitch envelope), and Metal (FM) modes
 */
export class AdvancedDrumSynth {
  private oscillators: Tone.Oscillator[] = [];
  private noiseBurst: Tone.NoiseSynth;
  private masterGain: Tone.Gain;
  private waveShaper: Tone.WaveShaper;
  private mode: 'skin' | 'liquid' | 'metal';
  private params: Required<Pick<FMSynthParams, 'pitch' | 'attack' | 'decay' | 'harmonics' | 'spread' | 'morph' | 'fold' | 'mode' | 'volume'>>;

  constructor(params: FMSynthParams) {
    this.params = {
      pitch: params.pitch ?? 36,
      attack: params.attack ?? 0.5,
      decay: params.decay ?? 0.2,
      harmonics: params.harmonics ?? 0.2,
      spread: params.spread ?? 0.1,
      morph: params.morph ?? 0,
      fold: params.fold ?? 0,
      mode: params.mode ?? 'skin',
      volume: params.volume ?? -10,
    };
    this.mode = this.params.mode;

    // Create waveshaper for folding
    this.waveShaper = new Tone.WaveShaper(this.createFoldCurve(this.params.fold), 4096);
    
    // Master gain
    this.masterGain = new Tone.Gain(Tone.dbToGain(this.params.volume)).toDestination();
    
    // Create 6 oscillators
    for (let i = 0; i < 6; i++) {
      const osc = new Tone.Oscillator({
        frequency: 0, // Will be set on trigger
        type: this.getWaveformType(this.params.morph),
      }).connect(this.waveShaper);
      
      this.waveShaper.connect(this.masterGain);
      this.oscillators.push(osc);
    }

    // Noise burst for attack
    this.noiseBurst = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.02,
        sustain: 0,
        release: 0.01,
      },
    }).connect(this.masterGain);
  }

  /**
   * Create wavefolder curve
   */
  private createFoldCurve(fold: number): Float32Array {
    const size = 4096;
    const curve = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      const x = (i / (size - 1)) * 2 - 1; // -1..1
      if (fold < 0.75) {
        // Harmonic grit (soft folding)
        const amount = fold * 4;
        curve[i] = Math.tanh(x * (1 + amount * 5));
      } else {
        // Pulse train distortion
        const pulseAmount = (fold - 0.75) * 20;
        curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.5 + pulseAmount);
      }
    }
    return curve;
  }

  /**
   * Get waveform type based on morph parameter
   */
  private getWaveformType(morph: number): 'sine' | 'triangle' | 'sawtooth' | 'square' {
    if (morph < 0.25) return 'sine';
    if (morph < 0.5) return 'triangle';
    if (morph < 0.75) return 'sawtooth';
    return 'square';
  }

  /**
   * Calculate frequency spacing for oscillators
   */
  private calculateFrequencies(fundamental: number, spread: number): number[] {
    const frequencies: number[] = [fundamental];
    
    for (let i = 1; i < 6; i++) {
      if (spread < 0.5) {
        // Harmonic series
        const harmonic = i + 1;
        frequencies.push(fundamental * harmonic);
      } else {
        // Inharmonic/chaotic spacing
        const chaos = (spread - 0.5) * 2;
        const ratio = (i + 1) * (1 + chaos * Math.random() * 3);
        frequencies.push(fundamental * ratio);
      }
    }
    
    return frequencies;
  }

  /**
   * Calculate individual oscillator gains based on harmonics parameter
   */
  private calculateGains(harmonics: number): number[] {
    const gains: number[] = [1]; // Osc 1 always at full
    
    for (let i = 1; i < 6; i++) {
      const oscIndex = i / 5; // 0.2, 0.4, 0.6, 0.8, 1.0
      if (harmonics >= oscIndex) {
        const blend = Math.min(1, (harmonics - oscIndex) * 5);
        gains.push(blend);
      } else {
        gains.push(0);
      }
    }
    
    return gains;
  }

  /**
   * Trigger the drum sound
   */
  trigger(note: number, velocity: number, time?: number) {
    const now = time || Tone.now();
    // Use pitch param if set, otherwise fall back to MIDI note
    const midiNote = this.params.pitch || note;
    const fundamental = Tone.Frequency(midiNote, 'midi').toFrequency();
    const vel = velocity / 127;

    // Calculate frequencies with spread
    const frequencies = this.calculateFrequencies(fundamental, this.params.spread);
    
    // Calculate gains based on harmonics
    const gains = this.calculateGains(this.params.harmonics);

    // Attack parameter handling
    const attackValue = this.params.attack;
    let attackTime = 0.001;
    let noiseAmount = 0;

    if (attackValue < 0.5) {
      // Left of center: add noise burst
      noiseAmount = (0.5 - attackValue) * 2;
      attackTime = 0.001;
    } else if (attackValue > 0.5) {
      // Right of center: slow attack
      attackTime = 0.001 + (attackValue - 0.5) * 0.1;
    }

    // Trigger noise burst if needed
    if (noiseAmount > 0) {
      this.noiseBurst.triggerAttackRelease('16n', now, noiseAmount * vel * 0.5);
    }

    // Start oscillators based on mode
    this.oscillators.forEach((osc, i) => {
      const freq = frequencies[i];
      const gain = gains[i] * vel;
      
      if (gain > 0.01) {
        osc.frequency.setValueAtTime(freq, now);
        osc.volume.setValueAtTime(Tone.gainToDb(gain), now);

        // Mode-specific behavior
        if (this.mode === 'liquid') {
          // Pitch drop envelope (50ms)
          osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.05);
        } else if (this.mode === 'metal' && i > 0) {
          // FM cross-modulation
          const modAmount = this.params.spread * 100;
          osc.frequency.setValueAtTime(freq * (1 + modAmount * Math.sin(i)), now);
        }

        // Individual decay per oscillator
        const oscDecay = this.params.decay * (1 + i * 0.1);
        
        osc.start(now + attackTime);
        osc.volume.exponentialRampToValueAtTime(Tone.gainToDb(0.001), now + attackTime + oscDecay);
        osc.stop(now + attackTime + oscDecay + 0.1);
      }
    });
  }

  /**
   * Update synthesis parameters
   */
  updateParams(params: Partial<FMSynthParams>) {
    if (params.pitch !== undefined) this.params.pitch = params.pitch;
    if (params.attack !== undefined) this.params.attack = params.attack;
    if (params.decay !== undefined) this.params.decay = params.decay;
    if (params.harmonics !== undefined) this.params.harmonics = params.harmonics;
    if (params.spread !== undefined) this.params.spread = params.spread;
    
    if (params.morph !== undefined) {
      this.params.morph = params.morph;
      const waveformType = this.getWaveformType(params.morph);
      this.oscillators.forEach(osc => {
        osc.type = waveformType;
      });
    }
    
    if (params.fold !== undefined) {
      this.params.fold = params.fold;
      this.waveShaper.curve = this.createFoldCurve(params.fold);
    }
    
    if (params.mode !== undefined) {
      this.mode = params.mode;
      this.params.mode = params.mode;
    }
    
    if (params.volume !== undefined) {
      this.params.volume = params.volume;
      this.masterGain.gain.value = Tone.dbToGain(params.volume);
    }
  }

  /**
   * Dispose of all audio nodes
   */
  dispose() {
    this.oscillators.forEach(osc => osc.dispose());
    this.noiseBurst.dispose();
    this.masterGain.dispose();
    this.waveShaper.dispose();
  }
}

