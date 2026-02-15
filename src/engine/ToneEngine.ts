import * as Tone from 'tone';
import type { MIDIEvent, Track } from './types';
import { calculateEventTimestamp } from './SwingCalculator';

class ToneEngine {
  private trackParts: (Tone.Part | null)[] = Array(9).fill(null);
  private players: Map<number, Tone.Player[]> = new Map();
  private fmSynths: Map<number, Tone.FMSynth> = new Map();
  private isInitialized = false;
  private stepCallback?: (step: number) => void;
  private stepScheduleId?: number;

  /**
   * Initialize the audio engine and Tone.js Transport
   */
  async initialize() {
    if (this.isInitialized) return;
    
    await Tone.start();
    
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
   * Set BPM for the Transport
   */
  setBPM(bpm: number) {
    Tone.Transport.bpm.value = bpm;
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
   * Load a sample for a track
   */
  async loadSample(trackId: number, url: string): Promise<void> {
    try {
      const player = new Tone.Player(url).toDestination();
      await player.load(url);
      
      if (!this.players.has(trackId)) {
        this.players.set(trackId, []);
      }
      this.players.get(trackId)!.push(player);
      
      console.log(`Sample loaded for track ${trackId}`);
    } catch (error) {
      console.error(`Failed to load sample for track ${trackId}:`, error);
      throw error;
    }
  }

  /**
   * Create FM synth for a track
   */
  createFMSynth(trackId: number, params: any) {
    const synth = new Tone.FMSynth({
      harmonicity: params.harmonicity || 3,
      modulationIndex: params.modulationIndex || 10,
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: params.attack || 0.001,
        decay: params.decay || 0.2,
        sustain: params.sustain || 0,
        release: params.release || 0.3,
      },
      modulation: {
        type: 'sine',
      },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0,
        release: 0.3,
      },
      volume: params.volume || -10,
    }).toDestination();
    
    this.fmSynths.set(trackId, synth);
  }

  /**
   * Update track sequence with new events
   */
  updateTrackSequence(
    trackId: number,
    track: Track,
    events: MIDIEvent[],
    globalSwing: number
  ) {
    // Dispose old part if exists
    if (this.trackParts[trackId]) {
      this.trackParts[trackId]!.stop();
      this.trackParts[trackId]!.dispose();
      this.trackParts[trackId] = null;
    }

    // Filter events for this track
    const trackEvents = events.filter((e) => e.trackId === trackId);
    
    if (trackEvents.length === 0) {
      return; // No events to schedule
    }

    // Calculate timestamps with swing
    const eventsWithTimestamps = trackEvents.map((event) => {
      const timestamp = calculateEventTimestamp(
        event.step,
        globalSwing,
        track.swing
      );
      return [timestamp, event] as [string, MIDIEvent];
    });

    // Create new Tone.Part
    const part = new Tone.Part((time, event: MIDIEvent) => {
      // Check mute/solo
      if (track.mute) return;
      
      // Play sound
      if (track.mode === 'sample') {
        this.playSample(trackId, event, time, track.volume);
      } else if (track.mode === 'fm') {
        this.playFMSynth(trackId, event, time, track.volume);
      }
    }, eventsWithTimestamps);

    part.loop = true;
    part.loopEnd = '1m';
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
    trackVolume: number
  ) {
    const players = this.players.get(trackId);
    if (!players || players.length === 0) {
      // No sample loaded, use FM synth as fallback or do nothing
      return;
    }

    // Use the first available player
    const player = players[0];
    
    // Clone player for polyphony
    const newPlayer = new Tone.Player(player.buffer).toDestination();
    newPlayer.volume.value = Tone.gainToDb((event.velocity / 127) * trackVolume);
    newPlayer.start(time);
    
    // Dispose after playback
    newPlayer.onstop = () => {
      newPlayer.dispose();
    };
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
    const synth = this.fmSynths.get(trackId);
    if (!synth) {
      // Create default synth if not exists
      this.createFMSynth(trackId, {});
      return this.playFMSynth(trackId, event, time, trackVolume);
    }

    // Convert MIDI note to frequency
    const frequency = Tone.Frequency(event.note, 'midi').toFrequency();
    
    // Trigger synth
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
    globalSwing: number
  ) {
    this.setBPM(bpm);
    tracks.forEach((track) => {
      this.updateTrackSequence(track.id, track, events, globalSwing);
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
    this.fmSynths.forEach((synth) => synth.dispose());
    
    // Clear maps
    this.players.clear();
    this.fmSynths.clear();
    this.trackParts = Array(9).fill(null);
    
    this.isInitialized = false;
  }
}

// Export singleton instance
export const toneEngine = new ToneEngine();
