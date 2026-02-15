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
    id: 1, name: 'Snare', midiNote: 38, mode: 'fm',
    swing: 0, volume: 0.8, mute: false, solo: false,
    fmParams: {
      synthType: 'advanced', pitch: 38, volume: -10,
      attack: 0.3, decay: 0.15, harmonics: 0.6, spread: 0.4,
      morph: 0.2, fold: 0.5, mode: 'skin',
      ...advancedDefaults,
    },
  },
  {
    id: 2, name: 'CHH', midiNote: 42, mode: 'fm',
    swing: 0, volume: 0.6, mute: false, solo: false,
    fmParams: {
      synthType: 'standard', pitch: 42, volume: -15,
      harmonicity: 3, modulationIndex: 15,
      fmAttack: 0.001, fmDecay: 0.05, fmSustain: 0, fmRelease: 0.05,
      ...standardDefaults,
    },
  },
  {
    id: 3, name: 'OHH', midiNote: 46, mode: 'fm',
    swing: 0, volume: 0.6, mute: false, solo: false,
    fmParams: {
      synthType: 'standard', pitch: 46, volume: -15,
      harmonicity: 3, modulationIndex: 12,
      fmAttack: 0.001, fmDecay: 0.3, fmSustain: 0, fmRelease: 0.3,
      ...standardDefaults,
    },
  },
  {
    id: 4, name: 'Clap', midiNote: 39, mode: 'fm',
    swing: 0, volume: 0.7, mute: false, solo: false,
    fmParams: {
      synthType: 'standard', pitch: 39, volume: -12,
      harmonicity: 2, modulationIndex: 6,
      fmAttack: 0.001, fmDecay: 0.1, fmSustain: 0, fmRelease: 0.1,
      ...standardDefaults,
    },
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
    id: 6, name: 'Shaker', midiNote: 70, mode: 'fm',
    swing: 0, volume: 0.5, mute: false, solo: false,
    fmParams: {
      synthType: 'standard', pitch: 70, volume: -18,
      harmonicity: 4, modulationIndex: 20,
      fmAttack: 0.001, fmDecay: 0.08, fmSustain: 0, fmRelease: 0.08,
      ...standardDefaults,
    },
  },
  {
    id: 7, name: 'Low Tom', midiNote: 45, mode: 'fm',
    swing: 0, volume: 0.7, mute: false, solo: false,
    fmParams: {
      synthType: 'standard', pitch: 45, volume: -10,
      harmonicity: 1.2, modulationIndex: 8,
      fmAttack: 0.001, fmDecay: 0.3, fmSustain: 0, fmRelease: 0.3,
      ...standardDefaults,
    },
  },
  {
    id: 8, name: 'Crash', midiNote: 49, mode: 'fm',
    swing: 0, volume: 0.6, mute: false, solo: false,
    fmParams: {
      synthType: 'standard', pitch: 49, volume: -12,
      harmonicity: 3.5, modulationIndex: 25,
      fmAttack: 0.001, fmDecay: 1.0, fmSustain: 0, fmRelease: 1.0,
      ...standardDefaults,
    },
  },
];

