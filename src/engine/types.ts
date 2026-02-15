export interface MIDIEvent {
  id: string;
  trackId: number; // 0-8 (9 tracks)
  step: number; // 0-15 (16 steps)
  note: number; // MIDI note number (e.g., 60 = C4)
  velocity: number; // 0-127
  tick: number; // Absolute tick position in sequence
  duration: number; // In ticks or seconds
  timestamp?: number; // Calculated at runtime with swing applied
}

export interface SampleData {
  name: string;
  buffer: AudioBuffer | null;
  url: string;
  startTime: number; // Sample start offset in seconds
  duration: number; // Sample playback duration in seconds
}

export interface FMSynthParams {
  synthType?: 'advanced' | 'standard';
  // Common
  pitch?: number; // Fundamental frequency (MIDI note)
  volume?: number; // Volume in dB
  // Advanced only (Kick/Snare)
  attack?: number; // 0-1: <0.5 noise burst, >0.5 slow attack, 0.5 classic pop
  decay?: number; // Master decay envelope (seconds)
  harmonics?: number; // 0-1: oscillators audible (0=1 osc, 1=6 oscs)
  spread?: number; // 0-1: frequency spacing (0=harmonic, 1=inharmonic)
  morph?: number; // 0-1: waveform (0=sine, 0.33=tri, 0.66=saw, 1=square)
  fold?: number; // 0-1: wavefolder amount
  mode?: 'skin' | 'liquid' | 'metal';
  // Standard FM (all other pads)
  harmonicity?: number; // Carrier/modulator ratio
  modulationIndex?: number; // FM depth
  fmAttack?: number; // Envelope attack time (seconds)
  fmDecay?: number; // Envelope decay time (seconds)
  fmSustain?: number; // Envelope sustain level
  fmRelease?: number; // Envelope release time (seconds)
  // Back-compat for existing FM synth utilities
  carrier?: number;
  modulator?: number;
  sustain?: number;
  release?: number;
}

export interface Track {
  id: number;
  name: string;
  mode: 'sample' | 'fm';
  midiNote: number; // Default MIDI note for this track
  swing: number; // 0-100, per-track swing offset
  volume: number; // 0-1
  mute: boolean;
  solo: boolean;
  sample?: SampleData;
  fmParams?: FMSynthParams;
}

export interface SequencerState {
  bpm: number; // 60-240
  globalSwing: number; // 0-100 (50 = no swing)
  tracks: Track[];
  events: MIDIEvent[]; // All MIDI events for all tracks
  currentStep: number; // 0-15, for visual feedback
  isPlaying: boolean;
}
