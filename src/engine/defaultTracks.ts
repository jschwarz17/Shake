import type { Track } from './types';

const advancedDefaults = {
  harmonicity: 3, modulationIndex: 10,
  fmAttack: 0.001, fmDecay: 0.2, fmSustain: 0, fmRelease: 0.3,
};

const standardDefaults = {
  attack: 0.5, decay: 0.2, harmonics: 0, spread: 0, morph: 0, fold: 0,
  mode: 'skin' as const,
};

export const DEFAULT_TRACKS: Track[] = [
  {
    id: 0, name: 'Kick', midiNote: 36, mode: 'fm',
    swing: 0, volume: 0.8, mute: false, solo: false,
    fmParams: {
      synthType: 'advanced', pitch: 36, volume: -10,
      attack: 0.5, decay: 0.3, harmonics: 0.2, spread: 0.1,
      morph: 0, fold: 0.3, mode: 'liquid',
      ...advancedDefaults,
    },
  },
  {
    id: 1, name: 'Bass', midiNote: 36, mode: 'sample',
    swing: 0, volume: 0.8, mute: false, solo: false,
  },
  {
    id: 2, name: 'Snare', midiNote: 38, mode: 'sample',
    swing: 0, volume: 0.8, mute: false, solo: false,
  },
  {
    id: 3, name: 'HH', midiNote: 42, mode: 'sample',
    swing: 0, volume: 0.6, mute: false, solo: false,
    sampleVariant: 'chh',
  },
  {
    id: 4, name: 'Clap', midiNote: 39, mode: 'sample',
    swing: 0, volume: 0.7, mute: false, solo: false,
  },
  {
    id: 5, name: 'Rim', midiNote: 37, mode: 'fm',
    swing: 0, volume: 0.7, mute: false, solo: false,
    fmParams: {
      synthType: 'standard', pitch: 37, volume: -12,
      harmonicity: 2.5, modulationIndex: 5,
      fmAttack: 0.001, fmDecay: 0.05, fmSustain: 0, fmRelease: 0.05,
      ...standardDefaults,
    },
  },
  {
    id: 6, name: 'Shaker', midiNote: 70, mode: 'sample',
    swing: 0, volume: 0.5, mute: false, solo: false,
  },
  {
    id: 7, name: 'Crash', midiNote: 49, mode: 'fm',
    swing: 0, volume: 0.7, mute: false, solo: false,
    fmParams: {
      synthType: 'standard', pitch: 49, volume: -12,
      harmonicity: 3.5, modulationIndex: 25,
      fmAttack: 0.001, fmDecay: 1.0, fmSustain: 0, fmRelease: 1.0,
      ...standardDefaults,
    },
  },
  {
    id: 8, name: 'Voice', midiNote: 60, mode: 'sample',
    swing: 0, volume: 0.8, mute: false, solo: false,
  },
];
