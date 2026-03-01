import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';

const KEY_ROOTS = ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab'] as const;
const CHORD_TYPES = ['Minor', 'Minor7', 'Major', 'Major7', 'Dominant7', 'Sus4', 'Diminished'] as const;

interface SingleScrollProps {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SingleScroll: React.FC<SingleScrollProps> = ({ options, value, onChange, className = '' }) => {
  const currentIndex = Math.max(0, (options as readonly string[]).findIndex((o) => o === value));
  const touchStartY = React.useRef<number | null>(null);

  const cycle = (dir: 1 | -1) => {
    const next = (currentIndex + dir + options.length) % options.length;
    onChange((options as readonly string[])[next]);
  };

  return (
    <div
      className={`flex items-center justify-center min-w-[3.5rem] h-9 rounded-lg bg-black/50 border border-white/20 text-white font-semibold text-sm tracking-wide select-none ${className}`}
      onWheel={(e) => {
        e.preventDefault();
        cycle(e.deltaY > 0 ? 1 : -1);
      }}
      onTouchStart={(e) => {
        touchStartY.current = e.touches[0].clientY;
      }}
      onTouchEnd={(e) => {
        if (touchStartY.current === null) return;
        const dy = touchStartY.current - e.changedTouches[0].clientY;
        touchStartY.current = null;
        if (Math.abs(dy) > 15) cycle(dy > 0 ? 1 : -1);
      }}
      role="spinbutton"
      tabIndex={0}
      aria-valuenow={currentIndex}
      aria-valuetext={value}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          cycle(-1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          cycle(1);
        }
      }}
    >
      <span className="px-2">{value}</span>
    </div>
  );
};

export const GlobalKeyPicker: React.FC = () => {
  const globalKeyRoot = useMIDIStore((s) => s.globalKeyRoot);
  const globalChordType = useMIDIStore((s) => s.globalChordType);
  const setGlobalKeyRoot = useMIDIStore((s) => s.setGlobalKeyRoot);
  const setGlobalChordType = useMIDIStore((s) => s.setGlobalChordType);

  const safeRoot = KEY_ROOTS.includes(globalKeyRoot as any) ? globalKeyRoot : 'C';
  const safeChord = CHORD_TYPES.includes(globalChordType as any) ? globalChordType : 'Minor';

  return (
    <div className="flex items-center gap-2">
      <span className="text-white/60 text-[10px] uppercase tracking-widest font-medium hidden sm:inline">
        Global Key
      </span>
      <div className="flex items-center gap-1.5">
        <SingleScroll
          options={KEY_ROOTS}
          value={safeRoot}
          onChange={setGlobalKeyRoot}
          className="text-cyan-100 border-cyan-500/40"
        />
        <SingleScroll
          options={CHORD_TYPES}
          value={safeChord}
          onChange={setGlobalChordType}
          className="text-blue-100 border-blue-500/40"
        />
      </div>
    </div>
  );
};
