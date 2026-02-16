import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import { FMTrackPanel } from './FMTrackPanel';
import { SoundView } from './SoundView';
import type { FMSynthParams } from '../engine/types';

const DEFAULT_STANDARD_FM_PARAMS: FMSynthParams = {
  synthType: 'standard',
  pitch: 60,
  volume: -10,
  harmonicity: 3,
  modulationIndex: 10,
  fmAttack: 0.001,
  fmDecay: 0.2,
  fmSustain: 0,
  fmRelease: 0.3,
};

export const SoundsView: React.FC = () => {
  const [selectedTrackId, setSelectedTrackId] = React.useState(0);
  const tracks = useMIDIStore((state) => state.tracks);
  const updateTrack = useMIDIStore((state) => state.updateTrack);
  const toggleTrackMode = useMIDIStore((state) => state.toggleTrackMode);

  const handleToggleMode = (trackId: number) => {
    const track = tracks[trackId];
    if (!track) return;
    const switchingToFm = track.mode === 'sample';
    if (switchingToFm && !track.fmParams) {
      updateTrack(trackId, {
        mode: 'fm',
        fmParams: {
          ...DEFAULT_STANDARD_FM_PARAMS,
          pitch: track.midiNote,
        },
      });
    } else {
      toggleTrackMode(trackId);
    }
  };

  const track = tracks[selectedTrackId];
  const isFm = track?.mode === 'fm';

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Track selector - all 9 tracks; Voice (id 8) in medium blue */}
      <div className="flex-shrink-0 p-3 border-b border-white/10 bg-[rgba(255,255,255,0.05)]">
        <h2 className="text-lg font-bold mb-2 text-white">Sounds</h2>
        <div className="flex gap-2 flex-wrap">
          {tracks.map((t) => {
            const isVoice = t.id === 8;
            const displayName = isVoice ? 'Voice' : t.name;
            const isSelected = selectedTrackId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTrackId(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isVoice
                    ? isSelected
                      ? 'bg-blue-600/40 border-2 border-blue-400 text-blue-100 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                      : 'bg-blue-900/30 border border-blue-500/60 text-blue-200 hover:border-blue-400 hover:bg-blue-800/40'
                    : isSelected
                      ? 'bg-black border border-cyan-400/70 text-white shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                      : 'bg-black border border-white/35 text-white hover:border-white/60'
                }`}
              >
                {displayName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content: FM panel or Sound view based on selected track mode */}
      {track && (
        isFm ? (
          <FMTrackPanel trackId={selectedTrackId} onToggleMode={handleToggleMode} />
        ) : (
          <div className="flex-1 min-h-0 overflow-auto">
            <SoundView trackId={selectedTrackId} />
          </div>
        )
      )}
    </div>
  );
};
