import React from 'react';
import { useMIDIStore } from './engine/MIDIStore';
import { toneEngine } from './engine/ToneEngine';
import { TRACK_ID_TO_SAMPLE_URL } from './engine/defaultSamples';
import { PadView } from './components/PadView';
import { SequencerView } from './components/SequencerView';
import { FMDrumView } from './components/FMDrumView';
import { SoundView } from './components/SoundView';
import { PresetSelector } from './components/PresetSelector';

console.log('App.tsx module loading...');

type View = 'pad' | 'sequencer' | 'fm' | 'sound' | 'presets';

function App() {
  console.log('App component rendering');
  
  const [currentView, setCurrentView] = React.useState<View>('pad');
  const [selectedTrack, setSelectedTrack] = React.useState(0);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  
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
          updateTrack(trackId, {
            sample: {
              name: `Default ${tracks[trackId].name}`,
              buffer: null,
              url: url,
              startTime: 0,
              duration: 1,
            },
          });
          console.log(`Loaded sample for track ${trackId}: ${tracks[trackId].name}`);
        } catch (error) {
          console.error(`Failed to load sample for track ${trackId}:`, error);
        }
      }
    }
    console.log('Default samples loaded!');
  };

  // Update Tone.js BPM whenever it changes (works even before init)
  React.useEffect(() => {
    toneEngine.setBPM(bpm);
  }, [bpm]);

  // Update Tone.js when events or settings change
  React.useEffect(() => {
    if (isInitialized) {
      toneEngine.updateAllTracks(tracks, events, bpm, globalSwing);
    }
  }, [isInitialized, bpm, globalSwing, tracks, events]);

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

  const btnBase = 'px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] text-xs font-bold uppercase tracking-widest text-[rgba(255,255,255,0.8)] transition-all duration-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white hover:border-[rgba(255,255,255,0.3)] active:scale-95 active:bg-[rgba(255,255,255,0.05)]';
  const btnActive = '!bg-[rgba(59,130,246,0.2)] !border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.3)]';

  return (
    <div className="h-screen w-full bg-[#050505] text-white overflow-hidden flex flex-col">
      {/* Header - fixed height */}
      <header className="h-16 flex-shrink-0 bg-[rgba(255,255,255,0.05)] backdrop-blur-md border-b border-[rgba(255,255,255,0.1)] flex items-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full px-4">
          <h1 className="text-white text-2xl font-bold tracking-wider ml-6">SHAKE</h1>

          {/* Transport Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className={`${btnBase} ${isPlaying ? 'text-green-400 border-green-400/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : ''}`}
            >
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <button
              onClick={handleStop}
              className={`${btnBase} active:text-red-400 active:border-red-400/50 active:shadow-[0_0_15px_rgba(248,113,113,0.3)]`}
            >
              STOP
            </button>
          </div>

          {/* BPM and Swing Controls */}
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-white/50 text-[10px] mb-0.5 uppercase tracking-widest">BPM</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="60"
                  max="240"
                  value={bpm}
                  onChange={(e) => setBPM(parseInt(e.target.value) || 120)}
                  className="w-32 accent-cyan-500"
                />
                <span className="text-white font-mono w-10 text-sm tabular-nums">{bpm}</span>
              </div>
            </div>
            <div>
              <label className="block text-white/50 text-[10px] mb-0.5 uppercase tracking-widest">
                Swing: {globalSwing}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={globalSwing}
                onChange={(e) => setGlobalSwing(parseInt(e.target.value))}
                className="w-32 accent-cyan-500"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - Frosted 3D Glass */}
      <nav className="flex-shrink-0 bg-[rgba(255,255,255,0.05)] backdrop-blur-md border-b border-[rgba(255,255,255,0.1)]">
        <div className="max-w-7xl mx-auto flex gap-1 px-4 py-2">
          {(['pad', 'sequencer', 'presets', 'fm', 'sound'] as View[]).map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`${btnBase} ${currentView === view ? btnActive : ''}`}
            >
              {view === 'fm' ? 'FM SYNTH' : view.toUpperCase()}
            </button>
          ))}
        </div>
      </nav>

      {/* Track Selector for Sound view only (FM shows all pads in scroll) */}
      {currentView === 'sound' && (
        <div className="flex-shrink-0 bg-[rgba(255,255,255,0.05)] backdrop-blur-md border-b border-[rgba(255,255,255,0.1)] px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <span className="text-white/50 text-xs uppercase tracking-widest mr-2">Select Track:</span>
            {tracks.map((track) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                className={`${btnBase} ${selectedTrack === track.id ? btnActive : ''}`}
              >
                {track.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content - flex-1 min-h-0, overflow-hidden for pad view */}
      <main className={`flex-1 min-h-0 flex flex-col ${currentView === 'pad' ? 'overflow-hidden' : 'overflow-auto'}`}>
        {currentView === 'pad' && <PadView />}
        {currentView === 'sequencer' && <SequencerView />}
        {currentView === 'presets' && <PresetSelector />}
        {currentView === 'fm' && <FMDrumView />}
        {currentView === 'sound' && <SoundView trackId={selectedTrack} />}
      </main>

      {/* Footer - fixed height */}
      <footer className="h-16 flex-shrink-0 bg-[rgba(255,255,255,0.05)] backdrop-blur-md border-t border-[rgba(255,255,255,0.1)] flex items-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full px-4 flex-wrap gap-3">
          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex flex-col gap-0.5">
              <label className="text-white/50 text-[10px] uppercase tracking-widest">Global BPM</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="60"
                  max="240"
                  value={bpm}
                  onChange={(e) => setBPM(parseInt(e.target.value) || 120)}
                  className="w-32 accent-cyan-500"
                />
                <span className="text-white font-mono w-12 text-sm">{bpm}</span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-white/50 text-[10px] uppercase tracking-widest">Swing</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={globalSwing}
                  onChange={(e) => setGlobalSwing(parseInt(e.target.value) || 50)}
                  className="w-32 accent-cyan-500"
                />
                <span className="text-white font-mono w-8 text-sm">{globalSwing}</span>
              </div>
            </div>
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`${btnBase} ${isRecording ? 'text-red-400 border-red-400/50 animate-pulse shadow-[0_0_15px_rgba(248,113,113,0.3)]' : ''}`}
            >
              Rec
            </button>
            <button className={btnBase}>
              Save
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <button className={btnBase}>Master</button>
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-[10px] uppercase tracking-widest">Master Volume</span>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="80"
                className="w-32 accent-cyan-500"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
