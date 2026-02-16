/**
 * Default drum sample URLs from Tone.js audio library
 * These samples are hosted on GitHub Pages and free to use
 * Source: https://github.com/Tonejs/audio
 */

const BASE_URL = 'https://tonejs.github.io/audio/drum-samples';

export const DEFAULT_DRUM_SAMPLES = {
  kick: `${BASE_URL}/Techno/kick.mp3`,
  snare: `${BASE_URL}/Techno/snare.mp3`,
  hihatClosed: `${BASE_URL}/Techno/hihat.mp3`,
  hihatOpen: `${BASE_URL}/acoustic-kit/hihat.mp3`,
  clap: `${BASE_URL}/breakbeat8/snare.mp3`, // Using breakbeat snare as clap
  rim: `${BASE_URL}/CR78/hihat.mp3`, // Using CR78 hihat as rim
  shaker: `${BASE_URL}/breakbeat9/hihat.mp3`, // Using breakbeat9 hihat as shaker
  tom: `${BASE_URL}/Techno/tom1.mp3`,
  crash: `${BASE_URL}/Techno/tom3.mp3`,
};

// Map track IDs to sample URLs
export const TRACK_ID_TO_SAMPLE_URL: { [key: number]: string } = {
  0: DEFAULT_DRUM_SAMPLES.kick,
  1: DEFAULT_DRUM_SAMPLES.snare,
  2: DEFAULT_DRUM_SAMPLES.hihatClosed,
  3: DEFAULT_DRUM_SAMPLES.hihatOpen,
  4: DEFAULT_DRUM_SAMPLES.clap,
  5: DEFAULT_DRUM_SAMPLES.rim,
  6: DEFAULT_DRUM_SAMPLES.shaker,
  7: DEFAULT_DRUM_SAMPLES.crash,
};
