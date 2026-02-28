import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import { toneEngine } from '../engine/ToneEngine';
import type { FMSynthParams } from '../engine/types';

export const FMSlider: React.FC<{
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}> = ({ label, description, value, min, max, step, suffix = '', onChange }) => (
  <div className="bg-black/20 px-3 py-2 rounded-lg">
    <div className="flex items-center justify-between mb-1">
      <label className="text-xs font-bold text-white">{label}</label>
      {description && <span className="text-[10px] text-white/40">{description}</span>}
    </div>
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-cyan-500"
      />
      <span className="text-sm font-mono w-16 text-right text-cyan-400 font-bold">
        {value.toFixed(step < 1 ? 2 : 0)}{suffix}
      </span>
    </div>
  </div>
);

interface FMTrackPanelProps {
  trackId: number;
  onToggleMode?: (trackId: number) => void;
}

export const FMTrackPanel: React.FC<FMTrackPanelProps> = ({ trackId, onToggleMode }) => {
  const tracks = useMIDIStore((state) => state.tracks);
  const updateTrack = useMIDIStore((state) => state.updateTrack);
  const setTrackVolume = useMIDIStore((state) => state.setTrackVolume);
  const toggleTrackMode = useMIDIStore((state) => state.toggleTrackMode);

  const track = tracks[trackId];
  if (!track?.fmParams) return null;

  const handleToggle = onToggleMode ?? toggleTrackMode;

  const updateParam = (id: number, param: keyof FMSynthParams, value: number | string) => {
    const t = tracks[id];
    if (!t?.fmParams) return;
    const updatedParams = { ...t.fmParams, [param]: value };
    updateTrack(id, { fmParams: updatedParams });
    toneEngine.updateFMSynthParams(id, { [param]: value });
  };

  const isAdvanced = track.fmParams.synthType === 'advanced';

  return (
    <div className="flex-1 min-h-0 p-3 sm:p-4 flex flex-col">
      <section className="flex-1 min-h-0 p-3 sm:p-4 rounded-lg bg-white/[0.03] border border-white/10 flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-shrink-0 gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-bold text-white">{track.name}</h3>
            <span className="text-[10px] uppercase tracking-wider text-white/40 bg-white/10 px-2 py-0.5 rounded">
              {isAdvanced ? '6-Osc Advanced' : 'Standard FM'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void toneEngine.triggerPad(trackId, track)}
              className="px-3 py-1.5 rounded-lg bg-black border border-cyan-400/70 text-xs font-medium hover:border-cyan-300 text-white"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => handleToggle(track.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black border border-white/35 text-xs font-medium hover:border-white/60 text-white"
            >
              <span className="w-10 h-5 rounded-full border border-white/20 bg-white/10 flex items-center px-0.5">
                <span className={`w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)] transition-all duration-200 ${track.mode === 'fm' ? 'ml-0' : 'ml-4'}`} />
              </span>
              {track.mode === 'fm' ? 'FM' : 'Sample'}
            </button>
          </div>
        </div>

        {isAdvanced && (
          <div className="flex gap-2 mb-3 flex-shrink-0 flex-wrap">
            {(['skin', 'liquid', 'metal'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => updateParam(track.id, 'mode', mode)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  track.fmParams!.mode === mode
                    ? 'bg-black border-2 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'bg-black border-2 border-white/35 text-white hover:border-white/60'
                }`}
              >
                {mode.toUpperCase()}
                <div className="text-[10px] mt-0.5 opacity-70">
                  {mode === 'skin' && 'Additive'}
                  {mode === 'liquid' && 'Pitch Drop'}
                  {mode === 'metal' && 'FM/Cross-Mod'}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 content-start">
          <FMSlider label="Track volume" description="level 0–100%" value={Math.round((track.volume ?? 1) * 100)} min={0} max={100} step={1} suffix="%" onChange={(v) => setTrackVolume(track.id, v / 100)} />
          <FMSlider label="Pitch" description="MIDI note" value={track.fmParams!.pitch ?? track.midiNote} min={24} max={96} step={1} onChange={(v) => updateParam(track.id, 'pitch', v)} />
          <FMSlider label="Volume" description="output level" value={track.fmParams!.volume ?? -10} min={-40} max={0} step={1} suffix="dB" onChange={(v) => updateParam(track.id, 'volume', v)} />

          {isAdvanced ? (
            <>
              <FMSlider label="Attack" description="noise ← → slow" value={track.fmParams!.attack ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => updateParam(track.id, 'attack', v)} />
              <FMSlider label="Decay" description="envelope" value={track.fmParams!.decay ?? 0.2} min={0.01} max={2} step={0.01} suffix="s" onChange={(v) => updateParam(track.id, 'decay', v)} />
              <FMSlider label="Harmonics" description="1 → 6 oscs" value={track.fmParams!.harmonics ?? 0.2} min={0} max={1} step={0.01} onChange={(v) => updateParam(track.id, 'harmonics', v)} />
              <FMSlider label="Spread" description="harmonic → chaotic" value={track.fmParams!.spread ?? 0.1} min={0} max={1} step={0.01} onChange={(v) => updateParam(track.id, 'spread', v)} />
              <FMSlider label="Morph" description="sin → tri → saw → sq" value={track.fmParams!.morph ?? 0} min={0} max={1} step={0.01} onChange={(v) => updateParam(track.id, 'morph', v)} />
              <FMSlider label="Fold" description="grit → pulse" value={track.fmParams!.fold ?? 0} min={0} max={1} step={0.01} onChange={(v) => updateParam(track.id, 'fold', v)} />
            </>
          ) : (
            <>
              <FMSlider label="Harmonicity" description="carrier/mod ratio" value={track.fmParams!.harmonicity ?? 3} min={0.5} max={8} step={0.1} onChange={(v) => updateParam(track.id, 'harmonicity', v)} />
              <FMSlider label="Mod Index" description="FM depth" value={track.fmParams!.modulationIndex ?? 10} min={0} max={30} step={0.5} onChange={(v) => updateParam(track.id, 'modulationIndex', v)} />
              <FMSlider label="Attack" description="seconds" value={track.fmParams!.fmAttack ?? 0.001} min={0.001} max={1} step={0.001} suffix="s" onChange={(v) => updateParam(track.id, 'fmAttack', v)} />
              <FMSlider label="Decay" description="seconds" value={track.fmParams!.fmDecay ?? 0.2} min={0.001} max={2} step={0.001} suffix="s" onChange={(v) => updateParam(track.id, 'fmDecay', v)} />
              <FMSlider label="Sustain" description="level" value={track.fmParams!.fmSustain ?? 0} min={0} max={1} step={0.01} onChange={(v) => updateParam(track.id, 'fmSustain', v)} />
              <FMSlider label="Release" description="seconds" value={track.fmParams!.fmRelease ?? 0.3} min={0.001} max={3} step={0.001} suffix="s" onChange={(v) => updateParam(track.id, 'fmRelease', v)} />
            </>
          )}
        </div>
      </section>
    </div>
  );
};
