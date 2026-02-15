import React from 'react';
import { useMIDIStore } from './engine/MIDIStore';
import { toneEngine } from './engine/ToneEngine';
import { loadAudioFile } from './engine/SampleLoader';
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

  // Update Tone.js when events or settings change
  React.useEffect(() => {
    if (isInitialized) {
      toneEngine.setBPM(bpm);
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

  // Sample upload handler
  const handleSampleUpload = async (trackId: number, file: File) => {
    try {
      const sample = await loadAudioFile(file);
      
      // Update store with sample data
      updateTrack(trackId, {
        sample: {
          name: sample.name,
          buffer: sample.buffer,
          url: sample.url,
          startTime: 0,
          duration: sample.buffer.duration,
        },
      });

      // Load sample into ToneEngine
      await toneEngine.loadSample(trackId, sample.url);
      
      console.log(`Sample loaded for track ${trackId}`);
    } catch (error) {
      console.error('Failed to load sample:', error);
      alert('Failed to load sample. Please try a different file.');
    }
  };

  // Track mode toggle
  const handleToggleMode = (trackId: number) => {
    const track = tracks[trackId];
    const newMode = track.mode === 'sample' ? 'fm' : 'sample';
    updateTrack(trackId, { mode: newMode });
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-white text-3xl font-bold">Shake</h1>
          
          {/* Transport Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayPause}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={handleStop}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
            >
              Stop
            </button>
          </div>

          {/* BPM and Swing Controls */}
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-gray-400 text-xs mb-1">BPM</label>
              <input
                type="number"
                min="60"
                max="240"
                value={bpm}
                onChange={(e) => setBPM(parseInt(e.target.value))}
                className="w-20 px-2 py-1 bg-gray-800 text-white rounded border border-gray-700"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">
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

      {/* Navigation */}
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex">
          {(['pad', 'sequencer', 'presets', 'fm', 'sound'] as View[]).map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`
                px-6 py-3 font-medium transition-all capitalize
                ${currentView === view
                  ? 'bg-black text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }
              `}
            >
              {view === 'fm' ? 'FM Synth' : view}
            </button>
          ))}
        </div>
      </nav>

      {/* Track Selector for FM/Sound views */}
      {(currentView === 'fm' || currentView === 'sound') && (
        <div className="bg-gray-900 border-b border-gray-800 p-4">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <span className="text-gray-400 text-sm">Select Track:</span>
            {tracks.map((track) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                className={`
                  px-4 py-2 rounded transition-all text-sm font-medium
                  ${selectedTrack === track.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }
                `}
              >
                {track.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {currentView === 'pad' && <PadView />}
        {currentView === 'sequencer' && <SequencerView />}
        {currentView === 'presets' && <PresetSelector />}
        {currentView === 'fm' && <FMDrumView trackId={selectedTrack} />}
        {currentView === 'sound' && <SoundView trackId={selectedTrack} />}
      </main>

      {/* Sample Upload Section */}
      {currentView === 'pad' && (
        <div className="max-w-7xl mx-auto p-6">
          <h3 className="text-white text-lg font-bold mb-3">Upload Samples</h3>
          <div className="grid grid-cols-3 gap-3">
            {tracks.map((track) => (
              <div key={track.id} className="flex items-center gap-2">
                <span className="text-gray-400 text-sm w-24">{track.name}</span>
                <label className="flex-1">
                  <input
                    type="file"
                    accept="audio/wav,audio/mp3,audio/mpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSampleUpload(track.id, file);
                    }}
                    className="hidden"
                  />
                  <div className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded cursor-pointer transition-all text-center border border-gray-700">
                    {track.sample ? '✓ Loaded' : 'Upload'}
                  </div>
                </label>
                <button
                  onClick={() => handleToggleMode(track.id)}
                  className={`
                    px-3 py-2 text-sm rounded transition-all
                    ${track.mode === 'fm'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                  `}
                >
                  {track.mode === 'fm' ? 'FM' : 'Sample'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          Shake - Web Music Sampler | Built with React, Tone.js, and Tailwind CSS
        </div>
      </footer>
    </div>
  );
}

export default App;
