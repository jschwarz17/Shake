import React from 'react';
import { useMIDIStore } from './engine/MIDIStore';
import { toneEngine } from './engine/ToneEngine';
import { TRACK_ID_TO_SAMPLE_URL, BASS_SUB_URL } from './engine/defaultSamples';
import { PadView } from './components/PadView';
import { SequencerView } from './components/SequencerView';
import { SoundsView } from './components/SoundsView';
import { GlobalKeyPicker } from './components/GlobalKeyPicker';

console.log('App.tsx module loading...');

type View = 'pad' | 'sequencer' | 'sounds';

function App() {
  console.log('App component rendering');
  
  const [currentView, setCurrentView] = React.useState<View>('pad');
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [masterVolume, setMasterVolume] = React.useState(80);
  
  const bpm = useMIDIStore((state) => state.bpm);
  const setBPM = useMIDIStore((state) => state.setBPM);
  const globalSwing = useMIDIStore((state) => state.globalSwing);
  const setGlobalSwing = useMIDIStore((state) => state.setGlobalSwing);
  const isPlaying = useMIDIStore((state) => state.isPlaying);
  const setIsPlaying = useMIDIStore((state) => state.setIsPlaying);
  const setCurrentStep = useMIDIStore((state) => state.setCurrentStep);
  const tracks = useMIDIStore((state) => state.tracks);
  const events = useMIDIStore((state) => state.events);
  const updateTrack = useMIDIStore((state) => state.updateTrack);
  const bassSubEnabled = useMIDIStore((state) => state.bassSubEnabled);

  // Initialize Tone.js on first user interaction
  const handleInit = async () => {
    if (!isInitialized) {
      await toneEngine.initialize();
      toneEngine.scheduleStepCallback(setCurrentStep);
      setIsInitialized(true);
      
      // Load default samples
      await loadDefaultSamples();
    }
  };

  // Load default drum samples in background (does not change track mode - user toggles per pad)
  const loadDefaultSamples = async () => {
    console.log('Loading default drum samples...');
    
    for (let trackId = 0; trackId < 9; trackId++) {
      const url = TRACK_ID_TO_SAMPLE_URL[trackId];
      if (url) {
        try {
          await toneEngine.loadSample(trackId, url);
          // Do not overwrite existing user/AI-assigned samples.
          const currentTrack = useMIDIStore.getState().tracks[trackId];
          if (!currentTrack?.sample?.url) {
            updateTrack(trackId, {
              sample: {
                name: `Default ${tracks[trackId].name}`,
                buffer: null,
                url: url,
                startTime: 0,
                duration: 1,
              },
            });
          }
          console.log(`Loaded sample for track ${trackId}: ${tracks[trackId].name}`);
        } catch (error) {
          console.error(`Failed to load sample for track ${trackId}:`, error);
        }
      }
      if (trackId === 1) {
        try {
          await toneEngine.loadBassSub(BASS_SUB_URL);
        } catch {
          // Sub is optional
        }
      }
    }
    console.log('Default samples loaded!');
  };

  // Update Tone.js BPM whenever it changes (works even before init)
  React.useEffect(() => {
    toneEngine.setBPM(bpm);
  }, [bpm]);

  // Apply master volume to engine (works before and after init)
  React.useEffect(() => {
    toneEngine.setMasterVolume(masterVolume / 100);
  }, [masterVolume]);

  // Update Tone.js when events or settings change (including bass sub toggle)
  React.useEffect(() => {
    if (isInitialized) {
      toneEngine.updateAllTracks(tracks, events, bpm, globalSwing, { bassSubEnabled });
    }
  }, [isInitialized, bpm, globalSwing, tracks, events, bassSubEnabled]);

  // Play/Pause handler
  const handlePlayPause = async () => {
    await handleInit();
    
    if (isPlaying) {
      toneEngine.pause();
      setIsPlaying(false);
    } else {
      toneEngine.start();
      setIsPlaying(true);
    }
  };

  // Stop handler
  const handleStop = () => {
    toneEngine.stop();
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const btnBase = 'modern-btn px-5 sm:px-8 py-3.5 sm:py-4 rounded-2xl !text-white text-base sm:text-lg font-bold uppercase tracking-wider transition-all duration-200';
  const transportBtn = 'modern-btn px-8 sm:px-14 py-5 sm:py-6 rounded-2xl !text-white text-lg sm:text-2xl font-extrabold uppercase tracking-wider transition-all duration-200';

  const btnActive = '!bg-black !text-white !border-white/80 shadow-[0_0_10px_rgba(255,255,255,0.2)]';

  return (
    <div className="h-screen w-full bg-[#050505] text-white overflow-hidden flex flex-col">
      {/* Header - fixed height */}
      <header className="flex-shrink-0 bg-[rgba(255,255,255,0.05)] backdrop-blur-md border-b border-[rgba(255,255,255,0.1)] py-2">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between w-full px-3 sm:px-4 gap-2">
          <h1 className="shake-logo text-4xl sm:text-6xl ml-3 sm:ml-14 leading-none">{'\u00A0'}SHAKE</h1>

          {/* Transport Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className={`${transportBtn} ${isPlaying ? 'text-green-400 border-green-400/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : ''}`}
            >
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <button
              onClick={handleStop}
              className={`${transportBtn} active:text-red-400 active:border-red-400/50 active:shadow-[0_0_15px_rgba(248,113,113,0.3)]`}
            >
              STOP
            </button>
          </div>

          {/* BPM and Swing Controls */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div>
              <label className="block text-white/50 text-xs mb-1 uppercase tracking-wider font-semibold">BPM</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="60"
                  max="240"
                  value={bpm}
                  onChange={(e) => setBPM(parseInt(e.target.value) || 120)}
                  className="w-28 sm:w-36 accent-cyan-500"
                />
                <span className="text-white font-semibold w-12 text-base tabular-nums">{bpm}</span>
              </div>
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1 uppercase tracking-wider font-semibold">
                Swing: {globalSwing}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={globalSwing}
                onChange={(e) => setGlobalSwing(parseInt(e.target.value))}
                className="w-28 sm:w-36 accent-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <GlobalKeyPicker />
          </div>
        </div>
      </header>

      {/* Navigation - Frosted 3D Glass */}
      <nav className="flex-shrink-0 bg-[rgba(255,255,255,0.05)] backdrop-blur-md border-b border-[rgba(255,255,255,0.1)]">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 px-3 sm:px-12 py-3">
          {(['pad', 'sequencer', 'sounds'] as View[]).map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`${btnBase} ${currentView === view ? btnActive : ''}`}
            >
              {view === 'sounds' ? 'SOUNDS' : view.toUpperCase()}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content - flex-1 min-h-0, overflow-hidden for pad view */}
      <main className={`flex-1 min-h-0 flex flex-col bg-black ${currentView === 'pad' ? 'overflow-hidden' : 'overflow-auto'}`}>
        {currentView === 'pad' && <PadView ensureInitialized={handleInit} />}
        {currentView === 'sequencer' && <SequencerView />}
        {currentView === 'sounds' && <SoundsView />}
      </main>

      {/* Footer - fixed height */}
      <footer className="flex-shrink-0 bg-[rgba(255,255,255,0.05)] backdrop-blur-md border-t border-[rgba(255,255,255,0.1)] py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full px-3 sm:px-12 flex-wrap gap-3">
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`${btnBase} ${isRecording ? 'text-red-400 border-red-400/50 animate-pulse shadow-[0_0_15px_rgba(248,113,113,0.3)]' : ''}`}
            >
              REC
            </button>
            <button className={btnBase}>
              SAVE
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <button className={btnBase}>MASTER</button>
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-xs uppercase tracking-wider font-semibold">Master Volume</span>
              <input
                type="range"
                min="0"
                max="100"
                value={masterVolume}
                onChange={(e) => setMasterVolume(Number(e.target.value))}
                className="w-28 sm:w-36 accent-cyan-500"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
