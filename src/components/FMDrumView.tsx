import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import type { FMSynthParams } from '../engine/types';

interface FMDrumViewProps {
  trackId: number;
}

export const FMDrumView: React.FC<FMDrumViewProps> = ({ trackId }) => {
  const track = useMIDIStore((state) => state.tracks[trackId]);
  const updateTrack = useMIDIStore((state) => state.updateTrack);

  if (!track.fmParams) return null;

  const updateParam = (param: keyof FMSynthParams, value: number) => {
    updateTrack(trackId, {
      fmParams: {
        ...track.fmParams!,
        [param]: value,
      },
    });
  };

  const params = track.fmParams;

  return (
    <div className="p-6">
      <h2 className="text-white text-2xl font-bold mb-4">
        FM Synth - {track.name}
      </h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Harmonicity */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Harmonicity
          </label>
          <input
            type="range"
            min="0.5"
            max="8"
            step="0.1"
            value={params.harmonicity}
            onChange={(e) => updateParam('harmonicity', parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-blue-400 text-sm">{params.harmonicity.toFixed(1)}</span>
        </div>

        {/* Modulation Index */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Modulation Index
          </label>
          <input
            type="range"
            min="0"
            max="30"
            step="0.5"
            value={params.modulationIndex}
            onChange={(e) => updateParam('modulationIndex', parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-blue-400 text-sm">{params.modulationIndex.toFixed(1)}</span>
        </div>

        {/* Attack */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Attack
          </label>
          <input
            type="range"
            min="0.001"
            max="1"
            step="0.001"
            value={params.attack}
            onChange={(e) => updateParam('attack', parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-blue-400 text-sm">{params.attack.toFixed(3)}s</span>
        </div>

        {/* Decay */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Decay
          </label>
          <input
            type="range"
            min="0.001"
            max="2"
            step="0.001"
            value={params.decay}
            onChange={(e) => updateParam('decay', parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-blue-400 text-sm">{params.decay.toFixed(3)}s</span>
        </div>

        {/* Sustain */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Sustain
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={params.sustain}
            onChange={(e) => updateParam('sustain', parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-blue-400 text-sm">{params.sustain.toFixed(2)}</span>
        </div>

        {/* Release */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Release
          </label>
          <input
            type="range"
            min="0.001"
            max="3"
            step="0.001"
            value={params.release}
            onChange={(e) => updateParam('release', parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-blue-400 text-sm">{params.release.toFixed(3)}s</span>
        </div>

        {/* Volume */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Volume (dB)
          </label>
          <input
            type="range"
            min="-40"
            max="0"
            step="1"
            value={params.volume}
            onChange={(e) => updateParam('volume', parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-blue-400 text-sm">{params.volume}dB</span>
        </div>
      </div>

      <div className="mt-6 bg-gray-900 p-4 rounded-lg">
        <h3 className="text-white font-medium mb-2">FM Synthesis Guide</h3>
        <ul className="text-gray-400 text-sm space-y-1">
          <li><strong>Harmonicity:</strong> Ratio between carrier and modulator frequencies</li>
          <li><strong>Modulation Index:</strong> Depth of frequency modulation (brightness)</li>
          <li><strong>Attack:</strong> How quickly the sound reaches full volume</li>
          <li><strong>Decay:</strong> How quickly the sound drops to sustain level</li>
          <li><strong>Sustain:</strong> Level held while note is active</li>
          <li><strong>Release:</strong> How quickly the sound fades after note ends</li>
        </ul>
      </div>
    </div>
  );
};
