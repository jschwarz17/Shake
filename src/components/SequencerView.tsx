import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import { toneEngine } from '../engine/ToneEngine';
import { RHYTHM_PRESETS } from '../presets/rhythmPresets';

interface StepButtonProps {
  step: number;
  isActive: boolean;
  isCurrent: boolean;
  onToggle: () => void;
  showMeasureLineLeft?: boolean;
}

const StepButton: React.FC<StepButtonProps> = ({
  step,
  isActive,
  isCurrent,
  onToggle,
  showMeasureLineLeft,
}) => (
  <button
    onClick={onToggle}
    className={`
      w-full h-full transition-colors !rounded-none
      !border-[0.5px] !border-white/45
      ${showMeasureLineLeft ? 'measure-line-left' : ''}
      ${isActive
        ? '!bg-[linear-gradient(145deg,#5f9dff_0%,#3b82f6_45%,#1d4ed8_100%)] !shadow-[0_0_14px_rgba(59,130,246,0.65),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-3px_8px_rgba(0,0,0,0.35)]'
        : '!bg-black !shadow-none'}
      ${isCurrent ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-[#050505]' : ''}
    `}
    title={`Step ${step + 1}`}
  />
);

const TrackLabelRow: React.FC<{
  name: string;
  isMuted: boolean;
  isSolo: boolean;
  onToggleMute: () => void;
  onToggleSolo: () => void;
}> = ({ name, isMuted, isSolo, onToggleMute, onToggleSolo }) => (
  <div className="w-[100px] sm:w-[160px] flex items-center justify-end pr-2 sm:pr-4 flex-shrink-0">
    <span className="text-sm sm:text-base font-bold tracking-wider text-white">
      {name}
    </span>
    <div className="flex gap-1 ml-1.5">
      <button
        onClick={onToggleMute}
        className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all border text-white ${isMuted ? 'bg-red-600 border-red-500' : 'bg-[rgba(51,65,85,0.8)] border-[rgba(255,255,255,0.2)] hover:bg-[rgba(71,85,105,0.9)]'}`}
      >
        M
      </button>
      <button
        onClick={onToggleSolo}
        className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all border text-white ${isSolo ? 'bg-yellow-600 border-yellow-500' : 'bg-[rgba(51,65,85,0.8)] border-[rgba(255,255,255,0.2)] hover:bg-[rgba(71,85,105,0.9)]'}`}
      >
        S
      </button>
    </div>
  </div>
);

const GENRE_TIMING: Record<string, { bpm: number; swing: number }> = {
  Rock: { bpm: 125, swing: 52.5 },
  'Hip Hop': { bpm: 90, swing: 62.5 },
  House: { bpm: 122.5, swing: 56 },
  Techno: { bpm: 135, swing: 51 },
  Trap: { bpm: 145, swing: 51.5 },
  Funk: { bpm: 100, swing: 67.5 },
  'Drum & Bass': { bpm: 170, swing: 52.5 },
  Reggae: { bpm: 75, swing: 65 },
  Jazz: { bpm: 140, swing: 75 },
  Latin: { bpm: 110, swing: 55 },
};

const SequencerGrid: React.FC<{
  tracks: { id: number }[];
  currentStep: number;
  toggleStep: (trackId: number, step: number) => void;
  stepCount: number;
}> = ({ tracks, currentStep, toggleStep, stepCount }) => {
  const events = useMIDIStore((state) => state.events);
  return (
    <div
      className="grid border-2 border-white/80 bg-black h-full"
      style={{
        gridTemplateRows: `repeat(${tracks.length}, minmax(0, 1fr))`,
        gridTemplateColumns: `repeat(${stepCount}, minmax(0, 1fr))`,
        gap: '0',
        backgroundColor: '#000000',
      }}
    >
      {tracks.map((track) => {
        const trackEvents = events.filter((e) => e.trackId === track.id);
        const activeSteps = new Set(trackEvents.map((e) => e.step));
        return (
          <React.Fragment key={track.id}>
            {Array.from({ length: stepCount }, (_, step) => (
              <StepButton
                key={step}
                step={step}
                isActive={activeSteps.has(step)}
                isCurrent={step === currentStep}
                onToggle={() => toggleStep(track.id, step)}
                showMeasureLineLeft={
                  stepCount === 16
                    ? step === 4 || step === 8 || step === 12
                    : step === 4
                }
              />
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------- DJ Effect Button ----------
const DJButton: React.FC<{
  label: string;
  active: boolean;
  color: 'cyan' | 'amber' | 'purple' | 'emerald';
  onClick: () => void;
  disabled?: boolean;
}> = ({ label, active, color, onClick, disabled }) => {
  const styles: Record<string, { on: string; glow: string }> = {
    cyan:    { on: 'bg-cyan-500/20 !border-cyan-400 !text-cyan-300',    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]' },
    amber:   { on: 'bg-amber-500/20 !border-amber-400 !text-amber-300', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]' },
    purple:  { on: 'bg-purple-500/20 !border-purple-400 !text-purple-300', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]' },
    emerald: { on: 'bg-emerald-500/20 !border-emerald-400 !text-emerald-300', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]' },
  };
  const s = styles[color];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider
        border-2 transition-all duration-200
        ${active ? `${s.on} ${s.glow}` : '!bg-black/50 !border-white/20 !text-white/60 hover:!border-white/40'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
    >
      {label}
    </button>
  );
};

// ---------- Filter XY Pad ----------
const FilterPad: React.FC<{
  onFilterChange: (position: number, q: number) => void;
}> = ({ onFilterChange }) => {
  const padRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const [dragging, setDragging] = useState(false);

  const applyPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!padRef.current) return;
      const rect = padRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
      setPos({ x, y });
      const q = 0.7 + y * 14.3;
      onFilterChange(x, q);
    },
    [onFilterChange],
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => applyPosition(e.clientX, e.clientY);
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, applyPosition]);

  let filterLabel = 'OFF';
  let dotColor = 'bg-white/60 shadow-[0_0_14px_rgba(255,255,255,0.4)]';
  if (pos.x > 0.52) {
    const t = (pos.x - 0.5) / 0.5;
    const freq = 20 * Math.pow(1000, t);
    filterLabel = `HPF ${freq >= 1000 ? `${(freq / 1000).toFixed(1)}k` : Math.round(freq)} Hz`;
    dotColor = 'bg-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.8)]';
  } else if (pos.x < 0.48) {
    const t = pos.x / 0.5;
    const freq = 20 * Math.pow(1000, t);
    filterLabel = `LPF ${freq >= 1000 ? `${(freq / 1000).toFixed(1)}k` : Math.round(freq)} Hz`;
    dotColor = 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]';
  }

  return (
    <div
      ref={padRef}
      onPointerDown={(e) => {
        setDragging(true);
        applyPosition(e.clientX, e.clientY);
      }}
      className="h-[100px] rounded-xl bg-black/60 border border-purple-500/40 cursor-crosshair relative overflow-hidden select-none mt-2"
      style={{ touchAction: 'none' }}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(168,85,247,0.3) 1px, transparent 1px)',
          backgroundSize: '10% 25%',
        }}
      />
      {/* Center line */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/30 pointer-events-none" />
      {/* Draggable dot */}
      <div
        className={`absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-colors duration-100 ${dotColor}`}
        style={{ left: `${pos.x * 100}%`, top: `${(1 - pos.y) * 100}%` }}
      />
      <span className="absolute top-1 left-2 text-[10px] text-cyan-300/50 font-semibold pointer-events-none">
        LPF
      </span>
      <span className="absolute top-1 right-2 text-[10px] text-orange-300/50 font-semibold pointer-events-none">
        HPF
      </span>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-purple-300 font-mono pointer-events-none">
        {filterLabel}
      </span>
    </div>
  );
};

// ---------- Main SequencerView ----------
export const SequencerView: React.FC = () => {
  const tracks = useMIDIStore((state) => state.tracks);
  const currentStep = useMIDIStore((state) => state.currentStep);
  const toggleMute = useMIDIStore((state) => state.toggleMute);
  const toggleSolo = useMIDIStore((state) => state.toggleSolo);
  const toggleStep = useMIDIStore((state) => state.toggleStep);
  const clearAllTracks = useMIDIStore((state) => state.clearAllTracks);
  const setBPM = useMIDIStore((state) => state.setBPM);
  const setGlobalSwing = useMIDIStore((state) => state.setGlobalSwing);

  const freezeActive = useMIDIStore((state) => state.freezeActive);
  const freezeStep = useMIDIStore((state) => state.freezeStep);
  const halfActive = useMIDIStore((state) => state.halfActive);
  const toggleFreeze = useMIDIStore((state) => state.toggleFreeze);
  const toggleHalf = useMIDIStore((state) => state.toggleHalf);
  const pages = useMIDIStore((state) => state.pages);
  const currentPageIndex = useMIDIStore((state) => state.currentPageIndex);
  const createNewPage = useMIDIStore((state) => state.createNewPage);
  const setCurrentPage = useMIDIStore((state) => state.setCurrentPage);

  const [filterActive, setFilterActive] = useState(false);

  // Reset DJ filter when filter pad is deactivated or component unmounts
  useEffect(() => {
    if (!filterActive) {
      toneEngine.setDJFilter(0.5, 1);
    }
  }, [filterActive]);

  useEffect(() => {
    return () => {
      toneEngine.setDJFilter(0.5, 1);
    };
  }, []);

  const handleFilterChange = useCallback((position: number, q: number) => {
    toneEngine.setDJFilter(position, q);
  }, []);

  const toggleFilter = () => setFilterActive((v) => !v);

  const stepCount = halfActive ? 8 : 16;
  const displayStep = freezeActive ? freezeStep : currentStep;

  if (!tracks || tracks.length === 0) {
    return (
      <div className="p-6 bg-[#050505] min-h-screen">
        <div className="bg-red-600 text-white p-4 rounded">
          ERROR: No tracks loaded! Check console.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 bg-[#050505] flex flex-col overflow-hidden">
      {/* Top controls */}
      <div className="px-3 sm:px-12 pt-1 pb-1 flex-shrink-0">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="text-base sm:text-lg font-bold tracking-wider uppercase text-white pl-[100px] sm:pl-[160px]">
            SEQUENCER
          </h2>
          <button
            onClick={clearAllTracks}
            className="modern-btn px-3 py-1.5 !text-white rounded-lg text-xs"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-5 gap-1 pl-[100px] sm:pl-[160px]">
          {RHYTHM_PRESETS.map((preset, index) => (
            <button
              key={preset.name}
              onClick={() => {
                const timing = GENRE_TIMING[RHYTHM_PRESETS[index].name];
                if (!timing) return;
                setBPM(timing.bpm);
                setGlobalSwing(timing.swing);
              }}
              className="modern-btn px-2 py-1.5 text-[9px] sm:text-[10px] uppercase tracking-wide rounded text-white transition-all border !border-blue-400/80"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sequencer grid */}
      <div className="flex-1 min-h-0 px-3 sm:px-12 py-1">
        <div className="flex h-full">
          <div
            className="flex flex-col justify-between flex-shrink-0"
            style={{ height: '100%' }}
          >
            {tracks.map((track) => (
              <TrackLabelRow
                key={track.id}
                name={track.name}
                isMuted={track.mute}
                isSolo={track.solo}
                onToggleMute={() => toggleMute(track.id)}
                onToggleSolo={() => toggleSolo(track.id)}
              />
            ))}
          </div>

          <div className="flex-1 min-w-0 relative h-full">
            <SequencerGrid
              tracks={tracks}
              currentStep={displayStep}
              toggleStep={toggleStep}
              stepCount={stepCount}
            />
            <div
              className="absolute top-0 bottom-0 pointer-events-none transition-all duration-75 z-10"
              style={{
                left: `calc((100% / ${stepCount}) * ${displayStep})`,
                width: `calc(100% / ${stepCount})`,
                background: 'rgba(56, 189, 248, 0.15)',
                borderLeft: '2px solid rgba(56, 189, 248, 0.6)',
                borderRight: '2px solid rgba(56, 189, 248, 0.6)',
              }}
            />
          </div>
        </div>
      </div>

      {/* DJ Effects Bar */}
      <div className="flex-shrink-0 px-3 sm:px-12 pb-2">
        <div className="border-t border-white/10 pt-2">
          <div className="flex gap-2 sm:gap-3">
            <DJButton
              label="Freeze"
              active={freezeActive}
              color="cyan"
              onClick={toggleFreeze}
            />
            <DJButton
              label="Half"
              active={halfActive}
              color="amber"
              onClick={toggleHalf}
            />
            <DJButton
              label="Filter"
              active={filterActive}
              color="purple"
              onClick={toggleFilter}
            />
            <DJButton
              label="New"
              active={false}
              color="emerald"
              onClick={createNewPage}
              disabled={pages.length >= 6}
            />
          </div>

          {filterActive && <FilterPad onFilterChange={handleFilterChange} />}

          {pages.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              {pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`
                    w-9 h-9 rounded-lg text-sm font-bold transition-all border-2
                    ${
                      i === currentPageIndex
                        ? 'bg-blue-500/30 !border-blue-400 !text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                        : '!bg-black/40 !border-white/15 !text-white/40 hover:!border-white/30'
                    }
                  `}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
