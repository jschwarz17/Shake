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
        w-full rounded-lg transition-all duration-150 border
        aspect-square min-h-[40px]
        ${isActive 
          ? 'bg-blue-500 border-blue-400' 
          : 'bg-slate-800/60 border-slate-600/50 hover:bg-slate-700/70 shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
        }
        ${isCurrent ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#050505]' : ''}
        ${step % 4 === 0 ? 'border-l-2 border-l-slate-600/50' : ''}
      `}
      title={`Step ${step + 1}`}
    />
  );
};

interface TrackRowProps {
  trackId: number;
  name: string;
  isMuted: boolean;
  isSolo: boolean;
  onToggleMute: () => void;
  onToggleSolo: () => void;
}

const TrackRow: React.FC<TrackRowProps> = ({
  trackId,
  name,
  isMuted,
  isSolo,
  onToggleMute,
  onToggleSolo,
}) => {
  // Get all events once and memoize the filtered result
  const allEvents = useMIDIStore((state) => state.events);
  const currentStep = useMIDIStore((state) => state.currentStep);
  const toggleStep = useMIDIStore((state) => state.toggleStep);

  // Filter events for this track using useMemo to prevent infinite loops
  const trackEvents = React.useMemo(
    () => allEvents.filter((e) => e.trackId === trackId),
    [allEvents, trackId]
  );

  const activeSteps = React.useMemo(
    () => new Set(trackEvents.map((e) => e.step)),
    [trackEvents]
  );

  return (
    <div className="flex items-center gap-3 mb-3">
      {/* Sample/sound name and controls - name prominent and highly visible */}
      <div className="w-36 flex flex-row items-center gap-2 flex-shrink-0">
        <span className="text-lg font-bold tracking-wider text-white min-w-[5rem] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ textShadow: '0 0 8px rgba(255,255,255,0.3)' }}>
          {name}
        </span>
        <div className="flex gap-1">
          <button
            onClick={onToggleMute}
            className={`
              px-2 py-1 rounded text-xs font-medium transition-all
              shadow-[0_2px_0_0_rgba(0,0,0,0.2)]
              active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
              ${isMuted ? 'bg-red-600 text-white border border-red-500' : 'bg-slate-700 text-white border border-slate-600 hover:bg-slate-600'}
            `}
          >
            M
          </button>
          <button
            onClick={onToggleSolo}
            className={`
              px-2 py-1 rounded text-xs font-medium transition-all
              shadow-[0_2px_0_0_rgba(0,0,0,0.2)]
              active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
              ${isSolo ? 'bg-yellow-600 text-white border border-yellow-500' : 'bg-slate-700 text-white border border-slate-600 hover:bg-slate-600'}
            `}
          >
            S
          </button>
        </div>
      </div>

      {/* 16 step buttons - relative for current step bar */}
      <div 
        className="flex-1 grid gap-1 min-w-0 relative"
        style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
      >
        {Array.from({ length: 16 }, (_, step) => (
          <StepButton
            key={step}
            trackId={trackId}
            step={step}
            isActive={activeSteps.has(step)}
            isCurrent={step === currentStep}
            onToggle={() => toggleStep(trackId, step)}
          />
        ))}
      </div>
    </div>
  );
};

export const SequencerView: React.FC = () => {
  const tracks = useMIDIStore((state) => state.tracks);
  const currentStep = useMIDIStore((state) => state.currentStep);
  const toggleMute = useMIDIStore((state) => state.toggleMute);
  const toggleSolo = useMIDIStore((state) => state.toggleSolo);
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
    <div className="p-6 min-h-screen bg-[#050505]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-2xl font-bold tracking-wider uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          Sequencer
        </h2>
        <button
          onClick={clearAllTracks}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all border border-red-500 shadow-[0_2px_0_0_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-0.5"
        >
          Clear All
        </button>
      </div>

      {/* Grid with current step indicator overlay */}
      <div className="relative">
        <div className="space-y-3 max-w-full overflow-x-auto">
          {tracks.map((track) => (
            <TrackRow
              key={track.id}
              trackId={track.id}
              name={track.name}
              isMuted={track.mute}
              isSolo={track.solo}
              onToggleMute={() => toggleMute(track.id)}
              onToggleSolo={() => toggleSolo(track.id)}
            />
          ))}
        </div>
        
        {/* Current step vertical bar - highlights the column being played */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none rounded transition-all duration-75"
          style={{
            left: `calc(9rem + (100% - 9rem - 1rem) * ${currentStep} / 16)`,
            width: `calc((100% - 9rem - 1rem) / 16)`,
            background: 'rgba(56, 189, 248, 0.15)',
            borderLeft: '2px solid rgba(56, 189, 248, 0.5)',
            borderRight: '2px solid rgba(56, 189, 248, 0.5)',
            boxShadow: 'inset 0 0 30px rgba(56, 189, 248, 0.2)',
          }}
        />
      </div>
    </div>
  );
};
