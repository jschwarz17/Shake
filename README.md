# Shake - Web Music Sampler

A modern MIDI-first Web Music Sampler built with React, Tailwind CSS, and Tone.js.

## Features

- **3x3 Pad Grid**: 9 drum pads with sample playback or FM synthesis
- **16-Step Sequencer**: Full step sequencer with per-track control
- **FM Synthesis**: Built-in FM drum synthesis engine for each pad
- **Sample Upload**: Load your own WAV/MP3 samples
- **Swing Timing**: Global and per-track swing control
- **Rhythm Presets**: 10 pre-programmed rhythm patterns (Rock, Hip Hop, House, etc.)
- **Waveform Visualization**: View and edit sample start/length
- **MIDI-First Architecture**: All data stored as MIDI-compatible events

## Tech Stack

- **React 18** with TypeScript
- **Tone.js** for audio engine and synthesis
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Vite** for build tooling

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser to the URL shown in the terminal (typically http://localhost:5173).

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # React components
│   ├── PadView.tsx     # 3x3 drum pad grid
│   ├── SequencerView.tsx   # 16-step sequencer
│   ├── FMDrumView.tsx  # FM synthesis parameters
│   ├── SoundView.tsx   # Waveform visualization
│   └── PresetSelector.tsx  # Rhythm presets
├── engine/             # Audio engine
│   ├── MIDIStore.ts    # Zustand store for MIDI events
│   ├── ToneEngine.ts   # Tone.js Transport integration
│   ├── SwingCalculator.ts  # Swing timing logic
│   ├── SampleLoader.ts # Sample loading utilities
│   ├── types.ts        # TypeScript interfaces
│   └── defaultTracks.ts    # Default drum kit
├── synth/
│   └── FMSynth.ts      # FM drum synthesis
├── presets/
│   └── rhythmPresets.ts    # 10 rhythm patterns
├── utils/
│   └── midiExport.ts   # MIDI export (placeholder)
├── App.tsx             # Main application
└── main.tsx            # Entry point
```

## Usage

### Playing Sounds

1. Click on any pad in the **Pad View** to trigger sounds
2. Toggle between **Sample** and **FM** modes for each pad
3. Upload your own samples using the upload buttons

### Creating Patterns

1. Go to **Sequencer** view
2. Click on steps to toggle notes on/off
3. Use **M** (Mute) and **S** (Solo) buttons to control tracks
4. Adjust **BPM** and **Swing** in the header

### Loading Presets

1. Go to **Presets** view
2. Click any preset to load a rhythm pattern
3. Edit the pattern in the Sequencer view

### FM Synthesis

1. Go to **FM Synth** view
2. Select a track
3. Adjust harmonicity, modulation index, and envelope parameters
4. Switch track mode to FM to hear the synthesized sound

### Sample Editing

1. Go to **Sound** view
2. Select a track with a loaded sample
3. Adjust start time and duration sliders
4. View the waveform visualization

## Default Drum Kit

1. Kick (MIDI 36)
2. Snare (MIDI 38)
3. Closed Hi-Hat (MIDI 42)
4. Open Hi-Hat (MIDI 46)
5. Clap (MIDI 39)
6. Rim (MIDI 37)
7. Shaker (MIDI 70)
8. Low Tom (MIDI 45)
9. Crash (MIDI 49)

## Rhythm Presets

1. **Rock** - Classic rock 4/4 beat
2. **Hip Hop** - Boom bap style
3. **House** - Four on the floor
4. **Techno** - Driving techno rhythm
5. **Trap** - Modern trap style
6. **Funk** - Funky syncopated groove
7. **Drum & Bass** - Fast breakbeat
8. **Reggae** - One drop reggae
9. **Jazz** - Swung jazz pattern
10. **Latin** - Latin percussion groove

## Future Enhancements

- MIDI file export functionality
- More synthesis engines (subtractive, additive)
- Pattern chaining and song mode
- Effects processing (reverb, delay, compression)
- Keyboard shortcuts
- MIDI controller support

## License

MIT

## Author

Built with ❤️ using modern web technologies
