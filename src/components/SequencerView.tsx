import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import { RHYTHM_PRESETS, loadPresetEvents } from '../presets/rhythmPresets';

interface StepButtonProps {
  trackId: number;
  step: number;
  isActive: boolean;
  isCurrent: boolean;
  onToggle: () => void;
}

const StepButton: React.FC<StepButtonProps> = ({
  step,
  isActive,
  isCurrent,
  onToggle,
}) => {
  const isGroupBoundary = step === 3 || step === 7 || step === 11;

  return (
    <button
      onClick={onToggle}
      className={`
        w-full h-full transition-colors
        ${isCurrent ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-[#050505]' : ''}
      `}
      style={{
        background: isActive
          ? 'linear-gradient(145deg, #5f9dff 0%, #3b82f6 45%, #1d4ed8 100%)'
          : '#000000',
        border: `0.5px solid ${isActive ? 'rgba(147,197,253,0.95)' : 'rgba(255,255,255,0.45)'}`,
        borderRight: isGroupBoundary
          ? `2px solid ${isActive ? 'rgba(147,197,253,0.95)' : 'rgba(255,255,255,0.75)'}`
          : undefined,
        boxShadow: isActive
          ? '0 0 14px rgba(59,130,246,0.65), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -3px 8px rgba(0,0,0,0.35)'
          : 'none',
      }}
      title={`Step ${step + 1}`}
    />
  );
};


const TrackLabelRow: React.FC<{ name: string; isMuted: boolean; isSolo: boolean; onToggleMute: () => void; onToggleSolo: () => void }> = ({
  name, isMuted, isSolo, onToggleMute, onToggleSolo,
}) => (
  <div className="w-[200px] flex items-center justify-end pr-6 flex-shrink-0">
    <span className="text-lg font-bold tracking-wider text-white">
      {name}
    </span>
    <div className="flex gap-1 ml-2">
      <button
        onClick={onToggleMute}
        className={`px-2 py-1 rounded text-xs font-medium transition-all border text-white ${isMuted ? 'bg-red-600 border-red-500' : 'bg-[rgba(51,65,85,0.8)] border-[rgba(255,255,255,0.2)] hover:bg-[rgba(71,85,105,0.9)]'}`}
      >
        M
      </button>
      <button
        onClick={onToggleSolo}
        className={`px-2 py-1 rounded text-xs font-medium transition-all border text-white ${isSolo ? 'bg-yellow-600 border-yellow-500' : 'bg-[rgba(51,65,85,0.8)] border-[rgba(255,255,255,0.2)] hover:bg-[rgba(71,85,105,0.9)]'}`}
      >
        S
      </button>
    </div>
  </div>
);

const SequencerGrid: React.FC<{
  tracks: { id: number }[];
  currentStep: number;
  toggleStep: (trackId: number, step: number) => void;
}> = ({ tracks, currentStep, toggleStep }) => {
  const events = useMIDIStore((state) => state.events);
  return (
    <div
      className="grid border-2 border-white/80 bg-black h-full"
      style={{
        gridTemplateRows: `repeat(${tracks.length}, minmax(0, 1fr))`,
        gridTemplateColumns: 'repeat(16, minmax(0, 1fr))',
        gap: '0',
        backgroundColor: '#000000',
      }}
    >
      {tracks.map((track) => {
        const trackEvents = events.filter((e) => e.trackId === track.id);
        const activeSteps = new Set(trackEvents.map((e) => e.step));
        return (
          <React.Fragment key={track.id}>
            {Array.from({ length: 16 }, (_, step) => (
              <StepButton
                key={step}
                trackId={track.id}
                step={step}
                isActive={activeSteps.has(step)}
                isCurrent={step === currentStep}
                onToggle={() => toggleStep(track.id, step)}
              />
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const SequencerView: React.FC = () => {
  const tracks = useMIDIStore((state) => state.tracks);
  const currentStep = useMIDIStore((state) => state.currentStep);
  const toggleMute = useMIDIStore((state) => state.toggleMute);
  const toggleSolo = useMIDIStore((state) => state.toggleSolo);
  const toggleStep = useMIDIStore((state) => state.toggleStep);
  const clearAllTracks = useMIDIStore((state) => state.clearAllTracks);
  const loadPreset = useMIDIStore((state) => state.loadPreset);

  if (!tracks || tracks.length === 0) {
    return (
      <div className="p-6 bg-[#050505] min-h-screen">
        <div className="bg-red-600 text-white p-4 rounded">
          ERROR: No tracks loaded! Check console.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 bg-[#050505] flex flex-col overflow-hidden">
      <div className="px-12 pt-2 pb-1 flex-shrink-0">
        <div className="flex flex-wrap gap-1 pl-[200px]">
          {RHYTHM_PRESETS.map((preset, index) => (
            <button
              key={preset.name}
              onClick={() => loadPreset(loadPresetEvents(RHYTHM_PRESETS[index]))}
              className="px-2 py-1 text-[10px] uppercase tracking-wide rounded bg-black text-white border border-white/40 hover:border-white/70 transition-all"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between px-12 py-3 flex-shrink-0">
        <h2 className="text-2xl font-bold tracking-wider uppercase text-white pl-[200px]">
          SEQUENCER
        </h2>
        <button
          onClick={clearAllTracks}
          className="px-4 py-2 !bg-black !text-white rounded-lg transition-all border border-white/40 hover:border-white/70 active:scale-95"
        >
          Clear All
        </button>
      </div>

      <div className="flex-1 min-h-0 px-12 pb-4">
        <div className="flex h-full">
          <div className="flex flex-col justify-between flex-shrink-0" style={{ height: '100%' }}>
            {tracks.map((track) => (
              <TrackLabelRow
                key={track.id}
                name={track.name}
                isMuted={track.mute}
                isSolo={track.solo}
                onToggleMute={() => toggleMute(track.id)}
                onToggleSolo={() => toggleSolo(track.id)}
              />
            ))}
          </div>

          <div className="flex-1 min-w-0 relative h-full">
            <SequencerGrid
              tracks={tracks}
              currentStep={currentStep}
              toggleStep={toggleStep}
            />
            <div
              className="absolute top-0 bottom-0 pointer-events-none transition-all duration-75"
              style={{
                left: `calc((100% / 16) * ${currentStep})`,
                width: `calc(100% / 16)`,
                background: 'rgba(56, 189, 248, 0.15)',
                borderLeft: '2px solid rgba(56, 189, 248, 0.6)',
                borderRight: '2px solid rgba(56, 189, 248, 0.6)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
