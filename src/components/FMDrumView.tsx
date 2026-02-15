import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import type { FMSynthParams } from '../engine/types';

const FMSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step, suffix = '', onChange }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1" style={{ color: '#ffffff' }}>{label}</label>
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
      <span className="text-sm font-mono w-16" style={{ color: '#ffffff' }}>{value}{suffix}</span>
    </div>
  </div>
);

interface FMDrumViewProps {}

export const FMDrumView: React.FC<FMDrumViewProps> = () => {
  const [selectedTrackId, setSelectedTrackId] = React.useState(0);
  const tracks = useMIDIStore((state) => state.tracks);
  const updateTrack = useMIDIStore((state) => state.updateTrack);
  const toggleTrackMode = useMIDIStore((state) => state.toggleTrackMode);

  const updateParam = (trackId: number, param: keyof FMSynthParams, value: number) => {
    const track = tracks[trackId];
    if (!track?.fmParams) return;
    updateTrack(trackId, {
      fmParams: { ...track.fmParams, [param]: value },
    });
  };

  const fmTracks = tracks.filter((t) => t.fmParams);
  const track = fmTracks.find((t) => t.id === selectedTrackId) ?? fmTracks[0];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Pad selector scroll bar at top */}
      <div className="flex-shrink-0 p-4 border-b border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)]">
        <h2 className="text-xl font-bold mb-3" style={{ color: '#ffffff' }}>FM Synth Settings</h2>
        <div className="overflow-x-auto pb-2 flex gap-2">
          {fmTracks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTrackId(t.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTrackId === t.id
                  ? 'bg-cyan-500/30 border border-cyan-400/50'
                  : 'bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.12)]'
              }`}
              style={{ color: '#ffffff' }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Single pad settings */}
      {track && (
        <div className="flex-1 overflow-auto p-6">
          <section className="p-4 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#ffffff' }}>{track.name}</h3>
              <button
                type="button"
                onClick={() => toggleTrackMode(track.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-xs font-medium hover:bg-[rgba(255,255,255,0.12)] transition-colors"
                style={{ color: '#ffffff' }}
              >
                <span className="w-10 h-5 rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.1)] flex items-start pt-0.5">
                  <span className={`w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)] transition-all duration-200 ${track.mode === 'fm' ? 'ml-0.5' : 'ml-5'}`} />
                </span>
                {track.mode === 'fm' ? 'FM' : 'Sample'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <FMSlider
                label="Harmonicity"
                value={track.fmParams!.harmonicity}
                min={0.5}
                max={8}
                step={0.1}
                onChange={(v) => updateParam(track.id, 'harmonicity', v)}
              />
              <FMSlider
                label="Modulation Index"
                value={track.fmParams!.modulationIndex}
                min={0}
                max={30}
                step={0.5}
                onChange={(v) => updateParam(track.id, 'modulationIndex', v)}
              />
              <FMSlider
                label="Attack (s)"
                value={track.fmParams!.attack}
                min={0.001}
                max={1}
                step={0.001}
                suffix="s"
                onChange={(v) => updateParam(track.id, 'attack', v)}
              />
              <FMSlider
                label="Decay (s)"
                value={track.fmParams!.decay}
                min={0.001}
                max={2}
                step={0.001}
                suffix="s"
                onChange={(v) => updateParam(track.id, 'decay', v)}
              />
              <FMSlider
                label="Sustain"
                value={track.fmParams!.sustain}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateParam(track.id, 'sustain', v)}
              />
              <FMSlider
                label="Release (s)"
                value={track.fmParams!.release}
                min={0.001}
                max={3}
                step={0.001}
                suffix="s"
                onChange={(v) => updateParam(track.id, 'release', v)}
              />
              <FMSlider
                label="Volume (dB)"
                value={track.fmParams!.volume}
                min={-40}
                max={0}
                step={1}
                suffix="dB"
                onChange={(v) => updateParam(track.id, 'volume', v)}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
