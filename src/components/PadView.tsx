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
        aspect-square rounded-2xl
        bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-md
        border border-white/10
        shadow-[0_8px_32px_0_rgba(0,0,0,0.6),_inset_0_0_30px_rgba(56,189,248,0.15)]
        flex flex-col items-center justify-center
        transition-all duration-150
        hover:from-slate-700/50 hover:to-slate-800/70 hover:border-cyan-400/30
        hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.6),_inset_0_0_40px_rgba(56,189,248,0.25)]
        active:scale-[0.98] active:shadow-[0_4px_16px_0_rgba(0,0,0,0.8),_inset_0_0_20px_rgba(0,0,0,0.5)]
        ${isActive ? 'scale-[0.98] shadow-[0_4px_16px_0_rgba(0,0,0,0.8),_inset_0_0_30px_rgba(56,189,248,0.4)]' : ''}
      `}
    >
      <span className="text-2xl font-bold tracking-widest text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]">
        {name}
      </span>
      <span className="text-xs text-cyan-300/80 uppercase mt-2 tracking-wider font-medium">
        {mode}
      </span>
      <div className="w-10 h-1 mx-auto mt-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_12px_rgba(56,189,248,1),_0_0_20px_rgba(56,189,248,0.6)]" />
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
    <div className="h-full w-full bg-[#050505] flex items-center justify-center p-8">
      {/* 3x3 Grid Container */}
      <div className="w-full max-w-4xl aspect-square">
        <div className="grid grid-cols-3 gap-4 h-full w-full">
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
    </div>
  );
};
