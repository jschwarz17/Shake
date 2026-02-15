import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import { toneEngine } from '../engine/ToneEngine';

interface PadProps {
  trackId: number;
  name: string;
  mode: 'sample' | 'fm';
  onTrigger: () => void;
  onToggleMode: (e: React.MouseEvent) => void;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  isActive: boolean;
  isPressedBySequence: boolean;
}

const Pad: React.FC<PadProps> = ({ name, mode, onTrigger, onToggleMode, onHoldStart, onHoldEnd, isActive, isPressedBySequence }) => {
  const isPressed = isActive || isPressedBySequence;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTrigger}
      onMouseDown={onHoldStart}
      onMouseUp={onHoldEnd}
      onMouseLeave={onHoldEnd}
      onTouchStart={onHoldStart}
      onTouchEnd={onHoldEnd}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTrigger(); } }}
      className={`
        aspect-square relative
        flex flex-col items-center justify-center
        rounded-[1.5rem]
        border border-[rgba(255,255,255,0.2)]
        bg-[rgba(51,65,85,0.7)]
        backdrop-blur-md
        transition-all duration-150 ease-out
        shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0px_10px_20px_rgba(255,255,255,0.08),inset_0px_-10px_30px_rgba(56,189,248,0.2)]
        hover:bg-[rgba(71,85,105,0.8)] hover:border-cyan-400/50
        active:scale-[0.98] active:shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0px_5px_10px_rgba(255,255,255,0.08),inset_0px_-5px_15px_rgba(56,189,248,0.25)]
        ${isPressed ? 'scale-[0.96] shadow-[0_2px_8px_rgba(0,0,0,0.6),inset_0px_6px_12px_rgba(0,0,0,0.4),inset_0px_-2px_8px_rgba(56,189,248,0.15)]' : ''}
        cursor-pointer
      `}
    >
      <span className="text-2xl font-bold tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-white">
        {name}
      </span>
      <span className="text-[0.65rem] uppercase tracking-[0.15em] mt-1 text-white">
        {mode}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleMode(e);
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseUp={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="relative z-10 mt-3 w-14 h-8 rounded-full border-2 border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.15)] flex items-center transition-all duration-200 hover:bg-[rgba(255,255,255,0.25)] hover:border-white/50 cursor-pointer"
        title={`Switch to ${mode === 'fm' ? 'sample' : 'FM'}`}
      >
        <div
          className={`w-6 h-6 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)] transition-all duration-200 flex-shrink-0 ${mode === 'fm' ? 'ml-1' : 'ml-7'}`}
        />
      </button>
      <div className="w-6 h-[3px] rounded-full bg-cyan-400 shadow-[0_0_10px_2px_rgba(34,211,238,0.8)] mt-2"></div>
    </div>
  );
};

export const PadView: React.FC = () => {
  const tracks = useMIDIStore((state) => state.tracks);
  const events = useMIDIStore((state) => state.events);
  const currentStep = useMIDIStore((state) => state.currentStep);
  const toggleTrackMode = useMIDIStore((state) => state.toggleTrackMode);
  const updateTrack = useMIDIStore((state) => state.updateTrack);
  const [activePads, setActivePads] = React.useState<Set<number>>(new Set());
  const holdRef = React.useRef<{ trackId: number; wasMuted: boolean; startTime: number } | null>(null);
  const suppressClickRef = React.useRef<Set<number>>(new Set());

  React.useEffect(() => {
    const clearHold = () => {
      const held = holdRef.current;
      if (!held) return;
      updateTrack(held.trackId, { mute: held.wasMuted });
      if (Date.now() - held.startTime > 200) {
        suppressClickRef.current = new Set(suppressClickRef.current).add(held.trackId);
      }
      holdRef.current = null;
    };
    window.addEventListener('mouseup', clearHold);
    window.addEventListener('touchend', clearHold);
    window.addEventListener('touchcancel', clearHold);
    return () => {
      window.removeEventListener('mouseup', clearHold);
      window.removeEventListener('touchend', clearHold);
      window.removeEventListener('touchcancel', clearHold);
    };
  }, [updateTrack]);

  const handleToggleMode = (trackId: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTrackMode(trackId);
  };

  const handleHoldStart = (trackId: number) => () => {
    if (holdRef.current) return;
    const track = tracks[trackId];
    if (!track) return;
    holdRef.current = { trackId, wasMuted: track.mute, startTime: Date.now() };
    updateTrack(trackId, { mute: true });
  };

  const handleHoldEnd = () => {
    const held = holdRef.current;
    if (!held) return;
    updateTrack(held.trackId, { mute: held.wasMuted });
    if (Date.now() - held.startTime > 200) {
      suppressClickRef.current = new Set(suppressClickRef.current).add(held.trackId);
    }
    holdRef.current = null;
  };

  const handlePadTrigger = (trackId: number) => {
    const track = tracks[trackId];
    if (!track) return;

    if (suppressClickRef.current.has(trackId)) {
      suppressClickRef.current = new Set(suppressClickRef.current);
      suppressClickRef.current.delete(trackId);
      return;
    }

    setActivePads((prev) => new Set(prev).add(trackId));
    setTimeout(() => {
      setActivePads((prev) => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
    }, 150);

    toneEngine.triggerPad(trackId, track);
  };

  const padsPressedBySequence = React.useMemo(() => {
    const set = new Set<number>();
    events.forEach((e) => {
      if (e.step === currentStep) set.add(e.trackId);
    });
    return set;
  }, [events, currentStep]);

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
            onToggleMode={handleToggleMode(track.id)}
            onHoldStart={handleHoldStart(track.id)}
            onHoldEnd={handleHoldEnd}
            isActive={activePads.has(track.id)}
            isPressedBySequence={padsPressedBySequence.has(track.id)}
          />
        ))}
      </div>
    </div>
  );
};
