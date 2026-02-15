import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';

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
  return (
    <button
      onClick={onToggle}
      className={`
        w-full rounded-sm transition-all duration-150 border-2 border-white
        aspect-square min-h-[40px]
        ${isActive 
          ? 'bg-blue-500 hover:bg-blue-600' 
          : 'bg-black hover:bg-gray-900'
        }
        ${isCurrent ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-[#050505]' : ''}
      `}
      title={`Step ${step + 1}`}
    />
  );
};


const TrackLabelRow: React.FC<{ name: string; isMuted: boolean; isSolo: boolean; onToggleMute: () => void; onToggleSolo: () => void }> = ({
  name, isMuted, isSolo, onToggleMute, onToggleSolo,
}) => (
  <div className="w-36 flex flex-row items-center gap-2 flex-shrink-0 min-h-[40px] py-2">
    <span className="text-lg font-bold tracking-wider min-w-[5rem]" style={{ color: '#ffffff' }}>
      {name}
    </span>
    <div className="flex gap-1">
      <button
        onClick={onToggleMute}
        className={`px-2 py-1 rounded text-xs font-medium transition-all border ${isMuted ? 'bg-red-600 border-red-500' : 'bg-[rgba(51,65,85,0.8)] border-[rgba(255,255,255,0.2)] hover:bg-[rgba(71,85,105,0.9)]'}`}
        style={{ color: '#ffffff' }}
      >
        M
      </button>
      <button
        onClick={onToggleSolo}
        className={`px-2 py-1 rounded text-xs font-medium transition-all border ${isSolo ? 'bg-yellow-600 border-yellow-500' : 'bg-[rgba(51,65,85,0.8)] border-[rgba(255,255,255,0.2)] hover:bg-[rgba(71,85,105,0.9)]'}`}
        style={{ color: '#ffffff' }}
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
      className="grid bg-neutral-800"
      style={{
        gridTemplateRows: `repeat(${tracks.length}, minmax(40px, 1fr))`,
        gridTemplateColumns: 'repeat(16, minmax(0, 1fr))',
        gap: '1px',
        padding: '1px',
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
    <div className="p-6 pl-20 min-h-screen bg-[#050505]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-wider uppercase" style={{ color: '#ffffff', fontFamily: "'Bebas Neue', sans-serif" }}>
          Sequencer
        </h2>
        <button
          onClick={clearAllTracks}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all border border-red-500 shadow-[0_2px_0_0_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-0.5"
        >
          Clear All
        </button>
      </div>

      {/* Labels + 9x16 grid with white border around grid */}
      <div className="relative flex max-w-full overflow-x-auto gap-3">
        {/* Left: track labels */}
        <div className="flex flex-col flex-shrink-0">
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

        {/* Right: 9x16 grid with outer white border */}
        <div className="flex-1 min-w-0 relative border-2 border-white bg-black rounded-sm">
          <SequencerGrid
            tracks={tracks}
            currentStep={currentStep}
            toggleStep={toggleStep}
          />
          {/* Current step vertical bar */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none rounded transition-all duration-75"
            style={{
              left: `calc(3px + (((100% - 21px) / 16 + 1px) * ${currentStep}))`,
              width: `calc((100% - 21px) / 16)`,
              background: 'rgba(56, 189, 248, 0.15)',
              borderLeft: '2px solid rgba(56, 189, 248, 0.5)',
              borderRight: '2px solid rgba(56, 189, 248, 0.5)',
              boxShadow: 'inset 0 0 30px rgba(56, 189, 248, 0.2)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
