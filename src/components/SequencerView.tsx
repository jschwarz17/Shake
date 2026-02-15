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
        w-full aspect-square rounded transition-all
        ${isActive ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}
        ${isCurrent ? 'ring-2 ring-white' : ''}
        ${step % 4 === 0 ? 'border-l-2 border-gray-600' : ''}
      `}
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
    <div className="flex items-center gap-2 mb-2">
      {/* Track name and controls */}
      <div className="w-32 flex flex-col gap-1">
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
      <div className="flex-1 grid grid-cols-16 gap-1">
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-2xl font-bold">Sequencer</h2>
        <button
          onClick={clearAllTracks}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-2">
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
    </div>
  );
};
