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
  carrier: number; // Carrier frequency multiplier
  modulator: number; // Modulator frequency multiplier
  modulationIndex: number; // FM depth
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  harmonicity: number;
  volume: number;
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
