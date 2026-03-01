import * as Tone from 'tone';
import type { MIDIEvent, Track } from './types';
import { calculateEventTimestamp } from './SwingCalculator';
import { AdvancedDrumSynth } from '../synth/AdvancedDrumSynth';
import { BASS_PRIMARY_URL, HH_CHH_URL, HH_OHH_URL, TRACK_ID_TO_SAMPLE_URL } from './defaultSamples';

class ToneEngine {
  private trackParts: (Tone.Part | null)[] = Array(9).fill(null);
  private players: Map<number, Tone.Player[]> = new Map();
  private drumSynths: Map<number, AdvancedDrumSynth> = new Map();
  private standardSynths: Map<number, Tone.FMSynth> = new Map();
  private isInitialized = false;
  private stepCallback?: (step: number) => void;
  private stepScheduleId?: number;
  private masterGain!: Tone.Gain;
  private masterVolume = 1;
  private bassSubPlayer: Tone.Player | null = null;
  private bassSubEnabled = false;
  private activeBassPlayers: Tone.Player[] = [];
  private bassFilter!: Tone.Filter;
  private djFilter!: Tone.Filter; // highpass for DJ filter effect
  private readonly BASS_ROOT_MIDI = 24;
  private readonly BASS_FILTER_FREQ = Tone.Frequency('B3').toFrequency();

  /**
   * Initialize the audio engine and Tone.js Transport
   */
  async initialize() {
    if (this.isInitialized) return;
    
    await Tone.start();
    Tone.getContext().lookAhead = 0.01;
    (Tone.getContext().rawContext as any).latencyHint = 'interactive';
    
    this.djFilter = new Tone.Filter({
      frequency: 20,
      type: 'highpass',
      rolloff: -12,
      Q: 1,
    }).toDestination();
    this.masterGain = new Tone.Gain(this.masterVolume).connect(this.djFilter);
    this.bassFilter = new Tone.Filter({
      frequency: this.BASS_FILTER_FREQ,
      type: 'lowpass',
      rolloff: -24,
    }).connect(this.masterGain);
    
    // Configure Transport
    Tone.Transport.bpm.value = 120;
    Tone.Transport.timeSignature = 4;
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = '1m'; // 1 measure = 16 steps
    
    this.isInitialized = true;
    console.log('Tone Engine initialized');
  }

  /**
   * Set master volume (0–1). Safe to call before initialize(); value is applied when engine starts.
   */
  setMasterVolume(gain: number) {
    this.masterVolume = Math.max(0, Math.min(1, gain));
    if (this.masterGain) this.masterGain.gain.value = this.masterVolume;
  }

  /**
   * Initialize FM synths for all tracks
   */
  initializeFMSynths(tracks: Track[]) {
    tracks.forEach((track) => {
      if (!track.fmParams) return;
      if (track.fmParams.synthType === 'advanced') {
        if (!this.drumSynths.has(track.id)) {
          this.createDrumSynth(track.id, track.fmParams);
        }
      } else {
        if (!this.standardSynths.has(track.id)) {
          this.createStandardFMSynth(track.id, track.fmParams);
        }
      }
    });
  }

  /**
   * Set BPM for the Transport
   */
  setBPM(bpm: number) {
    Tone.Transport.bpm.value = bpm;
  }

  /**
   * Trigger a pad immediately (sample or FM based on track mode).
   * Call this when user clicks a pad. Initializes Tone if needed.
   */
  async triggerPad(trackId: number, track: Track): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    // Use immediate time for pad hits to minimize perceived trigger latency.
    const now = Tone.immediate();
    const event: MIDIEvent = {
      id: `pad-${Date.now()}`,
      trackId,
      step: 0,
      note: track.midiNote,
      velocity: 100,
      tick: 0,
      duration: 0.1,
    };
    if (track.mode === 'sample') {
      const players = this.players.get(trackId);
      const needsLoad = !players?.length || !players[0].buffer?.loaded;
      if (needsLoad) {
        let url: string | undefined;
        if (trackId === 1) url = BASS_PRIMARY_URL;
        else if (trackId === 3) url = track.sampleVariant === 'ohh' ? HH_OHH_URL : HH_CHH_URL;
        else url = TRACK_ID_TO_SAMPLE_URL[trackId];
        if (url) await this.loadSample(trackId, url);
      }
      this.playSample(trackId, event, now, track);
    } else if (track.mode === 'fm') {
      this.initializeFMSynths([track]);
      this.playFMSynth(trackId, event, now, track.volume);
    }
  }

  /**
   * Start playback
   */
  start() {
    if (!this.isInitialized) {
      console.warn('ToneEngine not initialized. Call initialize() first.');
      return;
    }
    Tone.Transport.start();
  }

  /**
   * Stop playback
   */
  stop() {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
  }

  /**
   * Pause playback
   */
  pause() {
    Tone.Transport.pause();
  }

  /**
   * Schedule a callback for step visualization
   */
  scheduleStepCallback(callback: (step: number) => void) {
    this.stepCallback = callback;
    
    // Clear existing schedule
    if (this.stepScheduleId !== undefined) {
      Tone.Transport.clear(this.stepScheduleId);
    }
    
    // Schedule new callback
    this.stepScheduleId = Tone.Transport.scheduleRepeat((time) => {
      // Calculate current step (0-15)
      const ticks = Tone.Transport.ticks;
      const ppq = Tone.Transport.PPQ;
      const step = Math.floor((ticks / ppq) * 4) % 16;
      
      // Use Draw to sync with animation frame
      Tone.Draw.schedule(() => {
        if (this.stepCallback) {
          this.stepCallback(step);
        }
      }, time);
    }, '16n');
  }

  /**
   * Get the AudioBuffer for a track's loaded sample.
   * Returns null when no sample is loaded or buffer is not ready.
   */
  getSampleBuffer(trackId: number): AudioBuffer | null {
    const players = this.players.get(trackId);
    if (!players?.length) return null;
    const player = players[0];
    const toneBuffer = player.buffer;
    if (!toneBuffer?.loaded) return null;
    return toneBuffer.get() ?? null;
  }

  /**
   * Load a sample for a track. Initializes the engine if needed so loading works
   * even when the sequencer has never been started.
   */
  async loadSample(trackId: number, url: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    try {
      console.log(`Loading sample for track ${trackId} from ${url}`);
      const existingPlayers = this.players.get(trackId);
      if (existingPlayers?.length) {
        existingPlayers.forEach((p) => p.dispose());
      }
      const player = new Tone.Player(url).connect(this.masterGain);
      await player.load(url);
      this.players.set(trackId, [player]);
      
      console.log(`✓ Sample loaded successfully for track ${trackId}. Buffer duration: ${player.buffer.duration}s`);
    } catch (error) {
      console.warn(`✗ Failed to load sample for track ${trackId}:`, error);
      if (trackId !== 1) throw error;
      // Bass (track 1): don't throw so app works without custom bass files
    }
  }

  /**
   * Load bass sub sample (track 1). Call after loadSample(1, primaryUrl).
   */
  async loadBassSub(url: string): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    try {
      if (this.bassSubPlayer) {
        this.bassSubPlayer.dispose();
        this.bassSubPlayer = null;
      }
      const player = new Tone.Player(url).connect(this.masterGain);
      await player.load(url);
      this.bassSubPlayer = player;
      console.log('✓ Bass sub sample loaded');
    } catch (error) {
      console.warn('Bass sub sample failed to load (optional):', error);
    }
  }

  setBassSubEnabled(enabled: boolean) {
    this.bassSubEnabled = enabled;
  }

  setDJFilter(position: number, q: number) {
    if (!this.djFilter) return;
    const dead = 0.02;
    if (position > 0.5 + dead) {
      this.djFilter.type = 'highpass';
      const t = (position - 0.5) / 0.5;
      this.djFilter.frequency.rampTo(20 * Math.pow(1000, t), 0.05);
    } else if (position < 0.5 - dead) {
      this.djFilter.type = 'lowpass';
      const t = position / 0.5;
      this.djFilter.frequency.rampTo(20 * Math.pow(1000, t), 0.05);
    } else {
      this.djFilter.type = 'highpass';
      this.djFilter.frequency.rampTo(20, 0.05);
    }
    this.djFilter.Q.value = q;
  }

  setHalf(active: boolean) {
    if (this.isInitialized) {
      Tone.Transport.loopEnd = active ? '2n' : '1m';
    }
  }

  /**
   * Create advanced drum synth for a track (Kick/Snare)
   */
  createDrumSynth(trackId: number, params: any) {
    const synth = new AdvancedDrumSynth(params, this.masterGain);
    this.drumSynths.set(trackId, synth);
  }

  /**
   * Create standard FM synth for a track
   */
  createStandardFMSynth(trackId: number, params: any) {
    const synth = new Tone.FMSynth({
      harmonicity: params.harmonicity || 3,
      modulationIndex: params.modulationIndex || 10,
      oscillator: { type: 'sine' },
      envelope: {
        attack: params.fmAttack || 0.001,
        decay: params.fmDecay || 0.2,
        sustain: params.fmSustain || 0,
        release: params.fmRelease || 0.3,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: params.fmAttack || 0.001,
        decay: params.fmDecay || 0.2,
        sustain: params.fmSustain || 0,
        release: params.fmRelease || 0.3,
      },
      volume: params.volume || -10,
    }).connect(this.masterGain);
    this.standardSynths.set(trackId, synth);
  }

  /**
   * Update synth parameters in real-time
   */
  updateFMSynthParams(trackId: number, params: Partial<any>) {
    // Try advanced synth first
    const advSynth = this.drumSynths.get(trackId);
    if (advSynth) {
      advSynth.updateParams(params);
      return;
    }
    // Try standard FM synth
    const stdSynth = this.standardSynths.get(trackId);
    if (!stdSynth) return;

    if (params.harmonicity !== undefined) stdSynth.harmonicity.value = params.harmonicity;
    if (params.modulationIndex !== undefined) stdSynth.modulationIndex.value = params.modulationIndex;
    if (params.fmAttack !== undefined) {
      stdSynth.envelope.attack = params.fmAttack;
      stdSynth.modulationEnvelope.attack = params.fmAttack;
    }
    if (params.fmDecay !== undefined) {
      stdSynth.envelope.decay = params.fmDecay;
      stdSynth.modulationEnvelope.decay = params.fmDecay;
    }
    if (params.fmSustain !== undefined) {
      stdSynth.envelope.sustain = params.fmSustain;
      stdSynth.modulationEnvelope.sustain = params.fmSustain;
    }
    if (params.fmRelease !== undefined) {
      stdSynth.envelope.release = params.fmRelease;
      stdSynth.modulationEnvelope.release = params.fmRelease;
    }
    if (params.volume !== undefined) stdSynth.volume.value = params.volume;
  }

  /**
   * Update track sequence with new events
   */
  updateTrackSequence(
    trackId: number,
    track: Track,
    events: MIDIEvent[],
    bpm: number,
    globalSwing: number,
    allTracks: Track[],
    effectOptions?: { freezeActive?: boolean; freezeStep?: number; halfActive?: boolean }
  ) {
    if (this.trackParts[trackId]) {
      this.trackParts[trackId]!.stop();
      this.trackParts[trackId]!.dispose();
      this.trackParts[trackId] = null;
    }

    let trackEvents = events.filter((e) => e.trackId === trackId);

    if (effectOptions?.halfActive) {
      trackEvents = trackEvents.filter((e) => e.step < 8);
    }

    if (effectOptions?.freezeActive && effectOptions.freezeStep !== undefined) {
      const frozenEvents = trackEvents.filter((e) => e.step === effectOptions.freezeStep);
      const steps = effectOptions.halfActive ? 8 : 16;
      trackEvents = [];
      for (let step = 0; step < steps; step++) {
        for (const fe of frozenEvents) {
          trackEvents.push({ ...fe, id: `frz-${fe.id}-${step}`, step, tick: step * 4 });
        }
      }
    }

    if (trackEvents.length === 0) return;

    const hasSoloTracks = allTracks.some((t) => t.solo);
    const loopEnd = effectOptions?.halfActive ? '2n' : '1m';

    const eventsWithTimestamps = trackEvents.map((event) => {
      const timestamp = calculateEventTimestamp(event.step, bpm, globalSwing, track.swing);
      return [timestamp, event] as [number, MIDIEvent];
    });

    const part = new Tone.Part((time, event: MIDIEvent) => {
      if (track.mute) return;
      if (hasSoloTracks && !track.solo) return;

      if (track.mode === 'sample') {
        this.playSample(trackId, event, time, track);
      } else if (track.mode === 'fm') {
        this.playFMSynth(trackId, event, time, track.volume);
      }
    }, eventsWithTimestamps);

    part.loop = true;
    part.loopEnd = loopEnd;
    part.start(0);

    this.trackParts[trackId] = part;
  }

  /**
   * Play a sample
   */
  private playSample(
    trackId: number,
    event: MIDIEvent,
    time: number,
    track: Track
  ) {
    // Bass track (1): pitch-shifted sample playback with optional sub
    if (trackId === 1) {
      this.playBassSample(event, time, track);
      return;
    }

    const players = this.players.get(trackId);
    if (!players || players.length === 0) {
      console.warn(`No sample for track ${trackId}, using FM fallback`);
      this.playFMSynth(trackId, event, time, track.volume);
      return;
    }

    const player = players[0];
    const bufLoaded = player.buffer?.loaded ?? false;
    if (!player.buffer || !bufLoaded) {
      console.error(`Sample buffer not loaded for track ${trackId}`);
      return;
    }

    const newPlayer = new Tone.Player(player.buffer).connect(this.masterGain);
    newPlayer.volume.value = Tone.gainToDb((event.velocity / 127) * track.volume);
    const baseStart = Math.max(0, track.sample?.startTime ?? 0);
    const availableDuration = Math.max(0.01, player.buffer.duration - baseStart);
    const baseDuration = Math.max(0.01, Math.min(availableDuration, track.sample?.duration ?? availableDuration));
    let startTime = baseStart;
    let duration = baseDuration;

    if (track.sample?.chopEnabled && baseDuration > 0.05) {
      const chopCount = 4;
      const chopDuration = baseDuration / chopCount;
      const step = event.step ?? 0;
      const chopIndex = ((step * 31) + 17) % chopCount;
      startTime = baseStart + chopIndex * chopDuration;
      duration = Math.min(chopDuration, Math.max(0.01, player.buffer.duration - startTime));
    }

    newPlayer.start(time, startTime, duration);
    
    // Dispose after playback
    newPlayer.onstop = () => {
      newPlayer.dispose();
    };
  }

  private playBassSample(event: MIDIEvent, time: number, track: Track) {
    const players = this.players.get(1);
    if (!players?.length || !players[0].buffer?.loaded) return;
    const primary = players[0];
    let playbackRate = Math.pow(2, (event.note - this.BASS_ROOT_MIDI) / 12);
    playbackRate = Math.max(0.25, Math.min(4, playbackRate));
    const vol = (event.velocity / 127) * track.volume;
    const primaryGain = this.bassSubEnabled ? vol * 0.85 : vol;

    // Monophonic: stop any currently playing bass to avoid overlapping and digital artifacts
    for (const p of this.activeBassPlayers) {
      try {
        p.stop(time);
      } catch (_) {}
    }
    this.activeBassPlayers.length = 0;

    const maxDuration = 2; // primary: cap playback (lowpass filter reduces artifacts)
    const subMaxDuration = 1; // sub: short and punchy
    const playOne = (buf: Tone.ToneAudioBuffer, gain: number) => {
      const p = new Tone.Player(buf).connect(this.bassFilter);
      p.volume.value = Tone.gainToDb(gain);
      p.playbackRate = playbackRate;
      const duration = Math.min(buf.duration / playbackRate, maxDuration);
      p.start(time, 0, duration);
      this.activeBassPlayers.push(p);
      p.onstop = () => {
        const i = this.activeBassPlayers.indexOf(p);
        if (i >= 0) this.activeBassPlayers.splice(i, 1);
        p.dispose();
      };
    };

    playOne(primary.buffer, primaryGain);
    if (this.bassSubEnabled && this.bassSubPlayer?.buffer?.loaded) {
      const sub = this.bassSubPlayer;
      const p = new Tone.Player(sub.buffer).connect(this.bassFilter);
      p.volume.value = Tone.gainToDb(vol * 0.7);
      p.playbackRate = playbackRate;
      const subDuration = Math.min(sub.buffer.duration / playbackRate, subMaxDuration);
      p.start(time, 0, subDuration);
      this.activeBassPlayers.push(p);
      p.onstop = () => {
        const i = this.activeBassPlayers.indexOf(p);
        if (i >= 0) this.activeBassPlayers.splice(i, 1);
        p.dispose();
      };
    }
  }

  /**
   * Play FM synth
   */
  private playFMSynth(
    trackId: number,
    event: MIDIEvent,
    time: number,
    trackVolume: number
  ): void {
    // Try advanced synth (Kick/Snare)
    const advSynth = this.drumSynths.get(trackId);
    if (advSynth) {
      advSynth.trigger(event.note, event.velocity, time, trackVolume);
      return;
    }

    // Standard FM synth
    let synth = this.standardSynths.get(trackId);
    if (!synth) {
      this.createStandardFMSynth(trackId, {});
      synth = this.standardSynths.get(trackId)!;
    }

    const frequency = Tone.Frequency(event.note, 'midi').toFrequency();
    synth.volume.value = Tone.gainToDb((event.velocity / 127) * trackVolume);
    synth.triggerAttackRelease(frequency, event.duration || 0.1, time);
  }

  /**
   * Update all tracks with current state
   */
  updateAllTracks(
    tracks: Track[],
    events: MIDIEvent[],
    bpm: number,
    globalSwing: number,
    options?: {
      bassSubEnabled?: boolean;
      freezeActive?: boolean;
      freezeStep?: number;
      halfActive?: boolean;
    }
  ) {
    this.setBPM(bpm);
    if (options?.bassSubEnabled !== undefined) this.bassSubEnabled = options.bassSubEnabled;
    this.setHalf(!!options?.halfActive);
    this.initializeFMSynths(tracks);

    tracks.forEach((track) => {
      this.updateTrackSequence(track.id, track, events, bpm, globalSwing, tracks, {
        freezeActive: options?.freezeActive,
        freezeStep: options?.freezeStep,
        halfActive: options?.halfActive,
      });
    });
  }

  /**
   * Dispose all resources
   */
  dispose() {
    // Stop transport
    Tone.Transport.stop();
    
    // Dispose all parts
    this.trackParts.forEach((part) => {
      if (part) {
        part.stop();
        part.dispose();
      }
    });
    
    // Dispose all players
    this.players.forEach((players) => {
      players.forEach((player) => player.dispose());
    });
    
    // Dispose all synths
    this.drumSynths.forEach((synth) => synth.dispose());
    this.standardSynths.forEach((synth) => synth.dispose());
    
    // Clear maps
    this.players.clear();
    this.drumSynths.clear();
    this.standardSynths.clear();
    this.trackParts = Array(9).fill(null);
    if (this.bassFilter) this.bassFilter.dispose();
    if (this.djFilter) this.djFilter.dispose();
    if (this.masterGain) this.masterGain.dispose();
    
    this.isInitialized = false;
  }
}

// Export singleton instance
export const toneEngine = new ToneEngine();
