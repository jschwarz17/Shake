/**
 * Default drum/sample URLs
 * Bass files: copy Sub_Bass_C_2026-02-16T233213.wav → public/samples/bass_primary.wav, Sub_Bass_C_2026-02-16T232212.wav → public/samples/bass_sub.wav
 */

const BASE_URL = 'https://tonejs.github.io/audio/drum-samples';

export const DEFAULT_DRUM_SAMPLES = {
  kick: `${BASE_URL}/Techno/kick.mp3`,
  snare: `${BASE_URL}/Techno/snare.mp3`,
  hihatClosed: `${BASE_URL}/Techno/hihat.mp3`,
  hihatOpen: `${BASE_URL}/acoustic-kit/hihat.mp3`,
  clap: `${BASE_URL}/breakbeat8/snare.mp3`,
  rim: `${BASE_URL}/CR78/hihat.mp3`,
  shaker: '/samples/shaker.wav',
  crash: `${BASE_URL}/Techno/tom3.mp3`,
  voice: '/samples/voice_default.wav',
};

export const BASS_PRIMARY_URL = '/samples/bass_primary.wav';
export const BASS_SUB_URL = '/samples/bass_sub.wav';

export const HH_CHH_URL = DEFAULT_DRUM_SAMPLES.hihatClosed;
export const HH_OHH_URL = DEFAULT_DRUM_SAMPLES.hihatOpen;

// Map track IDs to default sample URL (Bass uses primary; HH uses CHH by default)
export const TRACK_ID_TO_SAMPLE_URL: { [key: number]: string } = {
  0: DEFAULT_DRUM_SAMPLES.kick,
  1: BASS_PRIMARY_URL,
  2: DEFAULT_DRUM_SAMPLES.snare,
  3: HH_CHH_URL,
  4: DEFAULT_DRUM_SAMPLES.clap,
  5: DEFAULT_DRUM_SAMPLES.rim,
  6: DEFAULT_DRUM_SAMPLES.shaker,
  7: DEFAULT_DRUM_SAMPLES.crash,
  8: DEFAULT_DRUM_SAMPLES.voice,
};
