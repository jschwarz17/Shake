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
      style={{
        background: 'linear-gradient(to bottom right, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
        backdropFilter: 'blur(12px)',
        boxShadow: isActive 
          ? '0 4px 16px 0 rgba(0,0,0,0.8), inset 0 0 30px rgba(56,189,248,0.4)'
          : '0 8px 32px 0 rgba(0,0,0,0.6), inset 0 0 30px rgba(56,189,248,0.15)',
      }}
      className={`
        aspect-square rounded-2xl
        border border-white/20
        flex flex-col items-center justify-center
        transition-all duration-150
        hover:border-cyan-400/50
        active:scale-[0.98]
        ${isActive ? 'scale-[0.98]' : ''}
      `}
    >
      <span className="text-3xl font-bold tracking-widest text-white" style={{ textShadow: '0 2px 10px rgba(255,255,255,0.5)' }}>
        {name}
      </span>
      <span className="text-sm text-cyan-200 uppercase mt-2 tracking-wider font-semibold">
        {mode}
      </span>
      <div 
        className="w-10 h-1 mx-auto mt-5 rounded-full"
        style={{
          background: 'linear-gradient(to right, rgb(56, 189, 248), rgb(59, 130, 246))',
          boxShadow: '0 0 12px rgba(56,189,248,1), 0 0 20px rgba(56,189,248,0.6)'
        }}
      />
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
    <div className="h-full w-full flex items-center justify-center p-4">
      {/* 3x3 Grid Container - constrained to fit viewport */}
      <div className="w-full h-full max-w-[90vh] max-h-[calc(100vh-200px)]">
        <div className="grid grid-cols-3 gap-3 h-full w-full">
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
