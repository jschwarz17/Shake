import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import { FMTrackPanel } from './FMTrackPanel';

export const FMDrumView: React.FC = () => {
  const [selectedTrackId, setSelectedTrackId] = React.useState(0);
  const tracks = useMIDIStore((state) => state.tracks);

  const fmTracks = tracks.filter((t) => t.fmParams);
  const track = fmTracks.find((t) => t.id === selectedTrackId) ?? fmTracks[0];

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-3 border-b border-white/10 bg-white/[0.03]">
        <h2 className="text-lg font-bold mb-2 text-white">FM Synth Settings</h2>
        <div className="flex gap-2 flex-wrap">
          {fmTracks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTrackId(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-white ${
                selectedTrackId === t.id
                  ? 'bg-black border border-cyan-400/70 text-white shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                  : 'bg-black border border-white/35 text-white hover:border-white/60'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {track && <FMTrackPanel trackId={track.id} />}
    </div>
  );
};
