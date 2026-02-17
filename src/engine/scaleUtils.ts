/**
 * Scale/chord mapping for bass module: which MIDI notes are in scale for a given key and chord type.
 * C0 = 24 in MIDI; we use 24 (C0) through 59 (B2) for 3 octaves.
 */

const ROOT_SEMITONES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

// Semitone offsets from root (within one octave) for each chord/scale type
const SCALE_INTERVALS: Record<string, number[]> = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Minor7: [0, 2, 3, 5, 7, 8, 10],
  Major7: [0, 2, 4, 5, 7, 9, 11],
  Dominant7: [0, 2, 4, 5, 7, 9, 10],
  Sus4: [0, 2, 4, 5, 7, 9, 11],
  Diminished: [0, 2, 3, 5, 6, 8, 9, 11],
};

const BASS_LOWEST_MIDI = 12; // C0 (MIDI)
const BASS_HIGHEST_MIDI = 47; // B2 (3 octaves: C0, C1, C2)

export function getScaleNotes(rootName: string, chordType: string): Set<number> {
  const rootSemitone = ROOT_SEMITONES[rootName] ?? 0;
  const intervals = SCALE_INTERVALS[chordType] ?? SCALE_INTERVALS.Minor;
  const set = new Set<number>();
  for (let octave = 0; octave <= 2; octave++) {
    const baseMidi = BASS_LOWEST_MIDI + octave * 12;
    for (const offset of intervals) {
      const midi = baseMidi + (rootSemitone + offset) % 12;
      if (midi >= BASS_LOWEST_MIDI && midi <= BASS_HIGHEST_MIDI) set.add(midi);
    }
  }
  return set;
}

export function getBassNoteRange(): { lowest: number; highest: number } {
  return { lowest: BASS_LOWEST_MIDI, highest: BASS_HIGHEST_MIDI };
}

export function midiToKeyLabel(midi: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12);
  return names[midi % 12] + octave;
}
