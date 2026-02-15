import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import { FMDrumSynth } from '../synth/FMSynth';

interface PadProps {
  trackId: number;
  name: string;
  mode: 'sample' | 'fm';
  onTrigger: () => void;
  isActive: boolean;
}

const Pad: React.FC<PadProps> = ({ name, mode, onTrigger, isActive }) => {
  return (
    <button
      onClick={onTrigger}
      className={`
        relative aspect-square rounded-lg border-2 transition-all
        flex flex-col items-center justify-center
        ${isActive 
          ? 'bg-blue-600 border-blue-400 ring-2 ring-blue-400 scale-95' 
          : 'bg-gray-900 border-gray-700 hover:border-blue-500 hover:bg-gray-800'
        }
      `}
    >
      <span className="text-white font-bold text-lg">{name}</span>
      <span className="text-blue-400 text-xs mt-1 uppercase">{mode}</span>
    </button>
  );
};

export const PadView: React.FC = () => {
  const tracks = useMIDIStore((state) => state.tracks);
  const [activePads, setActivePads] = React.useState<Set<number>>(new Set());
  const synthsRef = React.useRef<Map<number, FMDrumSynth>>(new Map());

  // Initialize FM synths for tracks
  React.useEffect(() => {
    tracks.forEach((track) => {
      if (track.mode === 'fm' && track.fmParams && !synthsRef.current.has(track.id)) {
        const synth = new FMDrumSynth(track.fmParams);
        synthsRef.current.set(track.id, synth);
      }
    });

    return () => {
      synthsRef.current.forEach((synth) => synth.dispose());
      synthsRef.current.clear();
    };
  }, [tracks]);

  const handlePadTrigger = (trackId: number) => {
    const track = tracks[trackId];
    
    // Visual feedback
    setActivePads((prev) => new Set(prev).add(trackId));
    setTimeout(() => {
      setActivePads((prev) => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
    }, 150);

    // Trigger sound
    if (track.mode === 'fm') {
      const synth = synthsRef.current.get(trackId);
      if (synth) {
        synth.trigger(track.midiNote, 100);
      }
    }
    // Sample playback would be handled by ToneEngine
  };

  return (
    <div className="p-6">
      <h2 className="text-white text-2xl font-bold mb-4">Pad View</h2>
      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        {tracks.map((track) => (
          <Pad
            key={track.id}
            trackId={track.id}
            name={track.name}
            mode={track.mode}
            onTrigger={() => handlePadTrigger(track.id)}
            isActive={activePads.has(track.id)}
          />
        ))}
      </div>
    </div>
  );
};
