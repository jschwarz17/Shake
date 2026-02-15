import type { MIDIEvent } from '../engine/types';

export interface RhythmPreset {
  name: string;
  description: string;
  events: Omit<MIDIEvent, 'id'>[];
}

const generateId = () => Math.random().toString(36).substring(2, 11);

/**
 * Helper to create events for a track
 */
const createEvents = (trackId: number, steps: number[], velocity = 100): Omit<MIDIEvent, 'id'>[] => {
  const trackMidiNotes = [36, 38, 42, 46, 39, 37, 70, 45, 49]; // Kick, Snare, CHH, OHH, Clap, Rim, Shaker, Tom, Crash
  
  return steps.map((step) => ({
    trackId,
    step,
    note: trackMidiNotes[trackId],
    velocity,
    tick: step * 4,
    duration: 0.1,
  }));
};

/**
 * Rock Beat
 */
export const ROCK_PRESET: RhythmPreset = {
  name: 'Rock',
  description: 'Classic rock 4/4 beat',
  events: [
    ...createEvents(0, [0, 4, 8, 12], 110), // Kick on 1, 2, 3, 4
    ...createEvents(1, [4, 12], 100), // Snare on 2 and 4
    ...createEvents(2, [0, 2, 4, 6, 8, 10, 12, 14], 80), // Hi-hat 8th notes
  ],
};

/**
 * Hip Hop Beat
 */
export const HIPHOP_PRESET: RhythmPreset = {
  name: 'Hip Hop',
  description: 'Boom bap style hip hop',
  events: [
    ...createEvents(0, [0, 10], 120), // Kick
    ...createEvents(1, [4, 12], 105), // Snare
    ...createEvents(2, [0, 2, 4, 6, 8, 10, 12, 14], 70), // Hi-hat
    ...createEvents(4, [8], 85), // Clap ghost note
  ],
};

/**
 * House Beat
 */
export const HOUSE_PRESET: RhythmPreset = {
  name: 'House',
  description: 'Four on the floor house',
  events: [
    ...createEvents(0, [0, 4, 8, 12], 115), // Kick on every beat
    ...createEvents(4, [4, 12], 95), // Clap on 2 and 4
    ...createEvents(2, [2, 6, 10, 14], 75), // Hi-hat offbeat
  ],
};

/**
 * Techno Beat
 */
export const TECHNO_PRESET: RhythmPreset = {
  name: 'Techno',
  description: 'Driving techno rhythm',
  events: [
    ...createEvents(0, [0, 4, 8, 12], 120), // Kick 4/4
    ...createEvents(2, [2, 6, 10, 14], 85), // CHH offbeat
    ...createEvents(3, [8], 90), // OHH accent
    ...createEvents(5, [5, 13], 70), // Rim accents
  ],
};

/**
 * Trap Beat
 */
export const TRAP_PRESET: RhythmPreset = {
  name: 'Trap',
  description: 'Modern trap style',
  events: [
    ...createEvents(0, [0, 6], 115), // Kick
    ...createEvents(1, [4], 105), // Snare
    ...createEvents(2, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 65), // Hi-hat rolls
    ...createEvents(6, [2, 10], 75), // Shaker
  ],
};

/**
 * Funk Beat
 */
export const FUNK_PRESET: RhythmPreset = {
  name: 'Funk',
  description: 'Funky syncopated groove',
  events: [
    ...createEvents(0, [0, 6, 12], 110), // Kick syncopation
    ...createEvents(1, [4], 100), // Snare on 2
    ...createEvents(2, [0, 2, 4, 6, 8, 10, 12, 14], 80), // Hi-hat
    ...createEvents(4, [7, 15], 85), // Clap accents
    ...createEvents(5, [10], 90), // Rim
  ],
};

/**
 * Drum and Bass
 */
export const DNB_PRESET: RhythmPreset = {
  name: 'Drum & Bass',
  description: 'Fast breakbeat style',
  events: [
    ...createEvents(0, [0, 9], 120), // Kick
    ...createEvents(1, [4, 12], 110), // Snare
    ...createEvents(2, [0, 2, 4, 5, 6, 8, 10, 11, 12, 14], 75), // Hi-hat complex pattern
  ],
};

/**
 * Reggae Beat
 */
export const REGGAE_PRESET: RhythmPreset = {
  name: 'Reggae',
  description: 'One drop reggae',
  events: [
    ...createEvents(0, [6, 14], 105), // Kick on offbeat
    ...createEvents(1, [4], 95), // Snare on 3
    ...createEvents(5, [2, 6, 10, 14], 85), // Rim clicks
  ],
};

/**
 * Jazz Beat
 */
export const JAZZ_PRESET: RhythmPreset = {
  name: 'Jazz',
  description: 'Swung jazz ride pattern',
  events: [
    ...createEvents(0, [0, 12], 95), // Kick
    ...createEvents(1, [4], 90), // Snare
    ...createEvents(5, [0, 3, 6, 9, 12, 15], 80), // Rim (ride cymbal pattern)
  ],
};

/**
 * Latin Beat
 */
export const LATIN_PRESET: RhythmPreset = {
  name: 'Latin',
  description: 'Latin percussion groove',
  events: [
    ...createEvents(0, [0, 6, 8], 105), // Kick
    ...createEvents(1, [4, 12], 100), // Snare
    ...createEvents(6, [0, 2, 4, 6, 8, 10, 12, 14], 85), // Shaker 8ths
    ...createEvents(7, [3, 11], 95), // Tom accents
    ...createEvents(4, [2, 10], 80), // Clap
  ],
};

/**
 * All presets array
 */
export const RHYTHM_PRESETS: RhythmPreset[] = [
  ROCK_PRESET,
  HIPHOP_PRESET,
  HOUSE_PRESET,
  TECHNO_PRESET,
  TRAP_PRESET,
  FUNK_PRESET,
  DNB_PRESET,
  REGGAE_PRESET,
  JAZZ_PRESET,
  LATIN_PRESET,
];

/**
 * Convert preset events to full MIDI events with IDs
 */
export const loadPresetEvents = (preset: RhythmPreset): MIDIEvent[] => {
  return preset.events.map((event) => ({
    ...event,
    id: generateId(),
  }));
};
