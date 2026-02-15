import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import { RHYTHM_PRESETS, loadPresetEvents } from '../presets/rhythmPresets';

export const PresetSelector: React.FC = () => {
  const loadPreset = useMIDIStore((state) => state.loadPreset);

  const handlePresetClick = (presetIndex: number) => {
    const preset = RHYTHM_PRESETS[presetIndex];
    const events = loadPresetEvents(preset);
    loadPreset(events);
  };

  return (
    <div className="p-6">
      <h2 className="text-white text-2xl font-bold mb-4">Rhythm Presets</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {RHYTHM_PRESETS.map((preset, index) => (
          <button
            key={index}
            onClick={() => handlePresetClick(index)}
            className="
              bg-slate-700 hover:bg-slate-600 border border-slate-600 
              rounded-lg p-4 transition-all text-left
              shadow-[0_2px_0_0_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)]
              hover:shadow-[0_1px_0_0_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.3)]
              active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
              active:translate-y-0.5
              text-white
            "
          >
            <h3 className="font-bold text-sm mb-1">{preset.name}</h3>
            <p className="text-xs">{preset.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

};
