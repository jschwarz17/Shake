import * as Tone from 'tone';
import type { FMSynthParams } from '../engine/types';

/**
 * FM Drum Synthesis Engine
 * Creates drum sounds using FM synthesis
 */
export class FMDrumSynth {
  private synth: Tone.FMSynth;
  private volume: Tone.Volume;

  constructor(params: FMSynthParams) {
    this.volume = new Tone.Volume(params.volume).toDestination();
    
    this.synth = new Tone.FMSynth({
      harmonicity: params.harmonicity,
      modulationIndex: params.modulationIndex,
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: params.attack,
        decay: params.decay,
        sustain: params.sustain,
        release: params.release,
      },
      modulation: {
        type: 'sine',
      },
      modulationEnvelope: {
        attack: params.attack,
        decay: params.decay,
        sustain: params.sustain,
        release: params.release,
      },
    }).connect(this.volume);
  }

  /**
   * Trigger the drum sound
   */
  trigger(note: number, velocity: number, time?: number, duration?: number) {
    const freq = Tone.Frequency(note, 'midi').toFrequency();
    const vel = velocity / 127;
    const dur = duration || 0.1;
    
    this.synth.triggerAttackRelease(freq, dur, time, vel);
  }

  /**
   * Update synth parameters
   */
  updateParams(params: Partial<FMSynthParams>) {
    if (params.harmonicity !== undefined) {
      this.synth.harmonicity.value = params.harmonicity;
    }
    if (params.modulationIndex !== undefined) {
      this.synth.modulationIndex.value = params.modulationIndex;
    }
    if (params.attack !== undefined) {
      this.synth.envelope.attack = params.attack;
      this.synth.modulationEnvelope.attack = params.attack;
    }
    if (params.decay !== undefined) {
      this.synth.envelope.decay = params.decay;
      this.synth.modulationEnvelope.decay = params.decay;
    }
    if (params.sustain !== undefined) {
      this.synth.envelope.sustain = params.sustain;
      this.synth.modulationEnvelope.sustain = params.sustain;
    }
    if (params.release !== undefined) {
      this.synth.envelope.release = params.release;
      this.synth.modulationEnvelope.release = params.release;
    }
    if (params.volume !== undefined) {
      this.volume.volume.value = params.volume;
    }
  }

  /**
   * Dispose of the synth
   */
  dispose() {
    this.synth.dispose();
    this.volume.dispose();
  }
}

/**
 * Create preset FM drum synths
 */
export const createKickSynth = (): FMDrumSynth => {
  return new FMDrumSynth({
    carrier: 1,
    modulator: 2,
    modulationIndex: 10,
    attack: 0.001,
    decay: 0.2,
    sustain: 0,
    release: 0.3,
    harmonicity: 1,
    volume: -10,
  });
};

export const createSnareSynth = (): FMDrumSynth => {
  return new FMDrumSynth({
    carrier: 2,
    modulator: 3,
    modulationIndex: 8,
    attack: 0.001,
    decay: 0.15,
    sustain: 0,
    release: 0.2,
    harmonicity: 1.5,
    volume: -10,
  });
};

export const createHiHatSynth = (): FMDrumSynth => {
  return new FMDrumSynth({
    carrier: 8,
    modulator: 12,
    modulationIndex: 15,
    attack: 0.001,
    decay: 0.05,
    sustain: 0,
    release: 0.05,
    harmonicity: 3,
    volume: -15,
  });
};

export const createClapSynth = (): FMDrumSynth => {
  return new FMDrumSynth({
    carrier: 2,
    modulator: 4,
    modulationIndex: 6,
    attack: 0.001,
    decay: 0.1,
    sustain: 0,
    release: 0.1,
    harmonicity: 2,
    volume: -12,
  });
};

export const createTomSynth = (): FMDrumSynth => {
  return new FMDrumSynth({
    carrier: 1.5,
    modulator: 2.5,
    modulationIndex: 8,
    attack: 0.001,
    decay: 0.3,
    sustain: 0,
    release: 0.3,
    harmonicity: 1.2,
    volume: -10,
  });
};

export const createCrashSynth = (): FMDrumSynth => {
  return new FMDrumSynth({
    carrier: 12,
    modulator: 18,
    modulationIndex: 25,
    attack: 0.001,
    decay: 1.0,
    sustain: 0,
    release: 1.0,
    harmonicity: 3.5,
    volume: -12,
  });
};
