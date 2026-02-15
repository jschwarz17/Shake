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
        w-full rounded transition-all border
        ${isActive 
          ? 'bg-blue-500 hover:bg-blue-600 border-blue-400' 
          : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
        }
        ${isCurrent ? 'ring-2 ring-blue-400' : ''}
        ${step % 4 === 0 ? 'border-l-2 border-gray-600' : ''}
      `}
      style={{ height: '48px', minHeight: '48px' }}
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
  const events = useMIDIStore((state) => state.getTrackEvents(trackId));
  const currentStep = useMIDIStore((state) => state.currentStep);
  const toggleStep = useMIDIStore((state) => state.toggleStep);

  const activeSteps = new Set(events.map((e) => e.step));

  return (
    <div className="flex items-center gap-3 mb-3">
      {/* Track name and controls */}
      <div className="w-32 flex flex-col gap-1 flex-shrink-0">
        <span className="text-white text-sm font-medium">{name}</span>
        <div className="flex gap-1">
          <button
            onClick={onToggleMute}
            className={`
              px-2 py-1 rounded text-xs font-medium transition-all
              ${isMuted ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
            `}
          >
            M
          </button>
          <button
            onClick={onToggleSolo}
            className={`
              px-2 py-1 rounded text-xs font-medium transition-all
              ${isSolo ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
            `}
          >
            S
          </button>
        </div>
      </div>

      {/* 16 step buttons */}
      <div 
        className="flex-1 grid gap-1 min-w-0"
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
  const toggleMute = useMIDIStore((state) => state.toggleMute);
  const toggleSolo = useMIDIStore((state) => state.toggleSolo);
  const clearAllTracks = useMIDIStore((state) => state.clearAllTracks);

  console.log('SequencerView rendering with tracks:', tracks);

  if (!tracks || tracks.length === 0) {
    return (
      <div className="p-6 bg-black min-h-screen">
        <div className="bg-red-600 text-white p-4 rounded">
          ERROR: No tracks loaded! Check console.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#000000' }}>
      {/* Forced visibility test box */}
      <div className="bg-red-500 text-white p-4 mb-4 rounded">
        TEST: If you can see this red box, rendering works! Tracks: {tracks.length}
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-2xl font-bold" style={{ color: '#ffffff' }}>
          Sequencer ({tracks.length} tracks)
        </h2>
        <button
          onClick={clearAllTracks}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
          style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
        >
          Clear All
        </button>
      </div>

      <div className="space-y-3 max-w-full overflow-x-auto">
        {tracks.map((track, index) => {
          console.log(`Rendering track ${index}:`, track.name);
          return (
            <TrackRow
              key={track.id}
              trackId={track.id}
              name={track.name}
              isMuted={track.mute}
              isSolo={track.solo}
              onToggleMute={() => toggleMute(track.id)}
              onToggleSolo={() => toggleSolo(track.id)}
            />
          );
        })}
      </div>
    </div>
  );
};
