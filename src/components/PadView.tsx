import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import { toneEngine } from '../engine/ToneEngine';

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
        aspect-square relative
        flex flex-col items-center justify-center
        rounded-[1.5rem]
        border border-white/10
        bg-slate-900/30
        backdrop-blur-md
        transition-all duration-150 ease-out
        shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0px_10px_20px_rgba(255,255,255,0.05),inset_0px_-10px_30px_rgba(56,189,248,0.15)]
        hover:bg-slate-800/40 hover:border-cyan-400/30
        active:scale-[0.98] active:shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0px_5px_10px_rgba(255,255,255,0.05),inset_0px_-5px_15px_rgba(56,189,248,0.2)]
        ${isActive ? 'scale-[0.98] shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0px_5px_10px_rgba(255,255,255,0.05),inset_0px_-5px_15px_rgba(56,189,248,0.2)]' : ''}
      `}
    >
      <span className="text-4xl font-bold tracking-wider text-white drop-shadow-md">
        {name}
      </span>
      <span className="text-[0.65rem] uppercase tracking-[0.15em] text-blue-200/70 mt-1">
        {mode}
      </span>
      <div className="w-6 h-[3px] rounded-full bg-cyan-400/80 shadow-[0_0_10px_2px_rgba(34,211,238,0.6)] mt-3"></div>
    </button>
  );
};

export const PadView: React.FC = () => {
  const tracks = useMIDIStore((state) => state.tracks);
  const [activePads, setActivePads] = React.useState<Set<number>>(new Set());

  const handlePadTrigger = (trackId: number) => {
    const track = tracks[trackId];
    if (!track) return;

    // Visual feedback
    setActivePads((prev) => new Set(prev).add(trackId));
    setTimeout(() => {
      setActivePads((prev) => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
    }, 150);

    // Trigger sound via ToneEngine (handles both sample and FM)
    toneEngine.triggerPad(trackId, track);
  };

  return (
    <div className="flex-1 min-h-0 flex items-center justify-center p-4 overflow-hidden">
      {/* 3x3 Grid - centered, square, fits viewport (no scrolling) */}
      <div 
        className="grid grid-cols-3 gap-4 w-full"
        style={{ 
          maxWidth: 'min(90vw, calc(100vh - 220px))',
          maxHeight: 'min(90vw, calc(100vh - 220px))',
          aspectRatio: '1'
        }}
      >
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
