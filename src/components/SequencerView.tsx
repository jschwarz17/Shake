import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import { RHYTHM_PRESETS } from '../presets/rhythmPresets';

interface StepButtonProps {
  trackId: number;
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
}) => {
return (
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
};


const TrackLabelRow: React.FC<{ name: string; isMuted: boolean; isSolo: boolean; onToggleMute: () => void; onToggleSolo: () => void }> = ({
  name, isMuted, isSolo, onToggleMute, onToggleSolo,
}) => (
  <div className="w-[120px] sm:w-[200px] flex items-center justify-end pr-2 sm:pr-6 flex-shrink-0">
    <span className="text-base sm:text-lg font-bold tracking-wider text-white">
      {name}
    </span>
    <div className="flex gap-1 ml-2">
      <button
        onClick={onToggleMute}
        className={`px-2 py-1 rounded text-xs font-medium transition-all border text-white ${isMuted ? 'bg-red-600 border-red-500' : 'bg-[rgba(51,65,85,0.8)] border-[rgba(255,255,255,0.2)] hover:bg-[rgba(71,85,105,0.9)]'}`}
      >
        M
      </button>
      <button
        onClick={onToggleSolo}
        className={`px-2 py-1 rounded text-xs font-medium transition-all border text-white ${isSolo ? 'bg-yellow-600 border-yellow-500' : 'bg-[rgba(51,65,85,0.8)] border-[rgba(255,255,255,0.2)] hover:bg-[rgba(71,85,105,0.9)]'}`}
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
}> = ({ tracks, currentStep, toggleStep }) => {
  const events = useMIDIStore((state) => state.events);
  return (
    <div
      className="grid border-2 border-white/80 bg-black h-full"
      style={{
        gridTemplateRows: `repeat(${tracks.length}, minmax(0, 1fr))`,
        gridTemplateColumns: 'repeat(16, minmax(0, 1fr))',
        gap: '0',
        backgroundColor: '#000000',
      }}
    >
      {tracks.map((track) => {
        const trackEvents = events.filter((e) => e.trackId === track.id);
        const activeSteps = new Set(trackEvents.map((e) => e.step));
        return (
          <React.Fragment key={track.id}>
            {Array.from({ length: 16 }, (_, step) => (
              <StepButton
                key={step}
                trackId={track.id}
                step={step}
                isActive={activeSteps.has(step)}
                isCurrent={step === currentStep}
                onToggle={() => toggleStep(track.id, step)}
                showMeasureLineLeft={step === 4 || step === 8 || step === 12}
              />
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const SequencerView: React.FC = () => {
  const tracks = useMIDIStore((state) => state.tracks);
  const currentStep = useMIDIStore((state) => state.currentStep);
  const toggleMute = useMIDIStore((state) => state.toggleMute);
  const toggleSolo = useMIDIStore((state) => state.toggleSolo);
  const toggleStep = useMIDIStore((state) => state.toggleStep);
  const clearAllTracks = useMIDIStore((state) => state.clearAllTracks);
  const setBPM = useMIDIStore((state) => state.setBPM);
  const setGlobalSwing = useMIDIStore((state) => state.setGlobalSwing);

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
      <div className="px-3 sm:px-12 pb-1 flex-shrink-0">
        <div className="ml-[120px] sm:ml-[200px] w-[330px] sm:w-[540px] h-3 sm:h-4 bg-black mb-2" />
        <div className="grid grid-cols-5 gap-1.5 pl-[120px] sm:pl-[200px]">
          {RHYTHM_PRESETS.map((preset, index) => (
            <button
              key={preset.name}
              onClick={() => {
                const timing = GENRE_TIMING[RHYTHM_PRESETS[index].name];
                if (!timing) return;
                setBPM(timing.bpm);
                setGlobalSwing(timing.swing);
              }}
              className="modern-btn px-2.5 sm:px-3 py-2 text-[10px] sm:text-xs uppercase tracking-wide rounded-lg text-white transition-all border !border-blue-400/80 shadow-[0_0_10px_rgba(56,189,248,0.25)]"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between px-3 sm:px-12 py-3 flex-shrink-0 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-wider uppercase text-white pl-[120px] sm:pl-[200px]">
          SEQUENCER
        </h2>
        <button
          onClick={clearAllTracks}
          className="modern-btn px-4 py-2.5 !text-white rounded-xl transition-all active:scale-95"
        >
          Clear All
        </button>
      </div>

      <div className="flex-1 min-h-0 px-3 sm:px-12 pb-8">
        <div className="flex" style={{ height: 'calc(100% - 20px)' }}>
          <div className="flex flex-col justify-between flex-shrink-0" style={{ height: '100%' }}>
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
              currentStep={currentStep}
              toggleStep={toggleStep}
            />
            <div
              className="absolute top-0 bottom-0 pointer-events-none transition-all duration-75 z-10"
              style={{
                left: `calc((100% / 16) * ${currentStep})`,
                width: `calc(100% / 16)`,
                background: 'rgba(56, 189, 248, 0.15)',
                borderLeft: '2px solid rgba(56, 189, 248, 0.6)',
                borderRight: '2px solid rgba(56, 189, 248, 0.6)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
