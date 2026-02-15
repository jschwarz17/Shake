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

  // Load default drum samples
  const loadDefaultSamples = async () => {
    console.log('Loading default drum samples...');
    
    for (let trackId = 0; trackId < 9; trackId++) {
      const url = TRACK_ID_TO_SAMPLE_URL[trackId];
      if (url) {
        try {
          await toneEngine.loadSample(trackId, url);
          
          // Update store to indicate sample is loaded and switch to sample mode
          updateTrack(trackId, {
            mode: 'sample',
            sample: {
              name: `Default ${tracks[trackId].name}`,
              buffer: null, // Buffer is managed by ToneEngine
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

  return (
    <div className="h-screen w-full bg-[#050505] text-white overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-md border-b border-gray-800/50 p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-white text-3xl font-bold tracking-wider">SHAKE</h1>
          
          {/* Transport Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayPause}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.2),0_6px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-0.5 border border-blue-500"
            >
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <button
              onClick={handleStop}
              className="px-6 py-2 bg-slate-600 text-white rounded-lg font-medium transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.2),0_6px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-0.5 border border-slate-500"
            >
              STOP
            </button>
          </div>

          {/* BPM and Swing Controls */}
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-gray-400 text-xs mb-1 uppercase tracking-wider">BPM</label>
              <input
                type="number"
                min="60"
                max="240"
                value={bpm}
                onChange={(e) => setBPM(Math.min(240, Math.max(60, parseInt(e.target.value) || 120)))}
                className="w-20 px-2 py-1 bg-slate-800 text-white rounded border border-slate-600 text-center shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1 uppercase tracking-wider">
                Swing: {globalSwing}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={globalSwing}
                onChange={(e) => setGlobalSwing(parseInt(e.target.value))}
                className="w-32"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - 3D raised buttons */}
      <nav className="bg-gray-900/20 backdrop-blur-md border-b border-white/5 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex">
          {(['pad', 'sequencer', 'presets', 'fm', 'sound'] as View[]).map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`
                px-6 py-3 font-semibold transition-all duration-200 tracking-widest
                rounded-lg mx-0.5
                shadow-[0_4px_0_0_rgba(0,0,0,0.2),0_6px_12px_rgba(0,0,0,0.3)]
                hover:shadow-[0_2px_0_0_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)]
                active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
                active:translate-y-0.5
                ${currentView === view
                  ? 'bg-white text-gray-900 border border-gray-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]'
                  : 'bg-slate-700/80 text-white border border-slate-600/80 hover:bg-slate-600/90'
                }
              `}
            >
              {view === 'fm' ? 'FM SYNTH' : view.toUpperCase()}
            </button>
          ))}
        </div>
      </nav>

      {/* Track Selector for FM/Sound views */}
      {(currentView === 'fm' || currentView === 'sound') && (
        <div className="bg-gray-900/30 backdrop-blur-md border-b border-gray-800/50 p-4 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <span className="text-gray-400 text-sm uppercase tracking-wider">Select Track:</span>
            {tracks.map((track) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                className={`
                  px-4 py-2 rounded text-sm font-medium transition-all
                  shadow-[0_2px_0_0_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)]
                  hover:shadow-[0_1px_0_0_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.3)]
                  active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
                  active:translate-y-0.5
                  ${selectedTrack === track.id
                    ? 'bg-blue-600 text-white border border-blue-500'
                    : 'bg-slate-700 text-white border border-slate-600 hover:bg-slate-600'
                  }
                `}
              >
                {track.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content - Takes up remaining space */}
      <main className={`flex-grow min-h-0 flex flex-col ${currentView === 'pad' ? 'overflow-hidden' : 'overflow-auto'}`}>
        {currentView === 'pad' && <PadView />}
        {currentView === 'sequencer' && <SequencerView />}
        {currentView === 'presets' && <PresetSelector />}
        {currentView === 'fm' && <FMDrumView trackId={selectedTrack} />}
        {currentView === 'sound' && <SoundView trackId={selectedTrack} />}
      </main>

      {/* Footer Controls */}
      <footer className="bg-gray-900/50 backdrop-blur-md border-t border-gray-800/50 p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-gray-400 text-xs uppercase tracking-wider">Global BPM</label>
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
            <div className="flex flex-col gap-1">
              <label className="text-gray-400 text-xs uppercase tracking-wider">Swing</label>
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
            <button className="px-4 py-2 bg-slate-700 text-white text-sm rounded border border-slate-600 uppercase tracking-wider shadow-[0_2px_0_0_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)] hover:bg-slate-600 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-0.5 transition-all">
              Rec
            </button>
            <button className="px-4 py-2 bg-slate-700 text-white text-sm rounded border border-slate-600 uppercase tracking-wider shadow-[0_2px_0_0_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)] hover:bg-slate-600 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-0.5 transition-all">
              Save
            </button>
          </div>
          
          <div className="flex gap-2 items-center">
            <button className="px-4 py-2 bg-slate-700 text-white text-sm rounded border border-slate-600 uppercase tracking-wider shadow-[0_2px_0_0_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)] hover:bg-slate-600 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-0.5 transition-all">
              Master
            </button>
            <button className="px-4 py-2 bg-slate-700 text-white text-sm rounded border border-slate-600 uppercase tracking-wider shadow-[0_2px_0_0_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)] hover:bg-slate-600 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-0.5 transition-all">
              Master
            </button>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs uppercase tracking-wider">Master Volume</span>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="80"
                className="w-32"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
