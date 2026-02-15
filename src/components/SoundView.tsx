import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import { extractWaveformData } from '../engine/SampleLoader';

interface WaveformProps {
  waveformData: number[];
  startTime: number;
  duration: number;
}

const Waveform: React.FC<WaveformProps> = ({ waveformData, startTime, duration }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    ctx.strokeStyle = '#60A5FA'; // blue-400
    ctx.lineWidth = 2;
    ctx.beginPath();

    const step = width / waveformData.length;
    const amp = height / 2;

    waveformData.forEach((value, i) => {
      const x = i * step;
      const y = amp - value * amp;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw center line
    ctx.strokeStyle = '#374151'; // gray-700
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, amp);
    ctx.lineTo(width, amp);
    ctx.stroke();

    // Draw start/end markers
    ctx.fillStyle = '#3B82F6'; // blue-500
    ctx.globalAlpha = 0.3;
    const startX = (startTime / (duration || 1)) * width;
    const endX = width;
    ctx.fillRect(startX, 0, endX - startX, height);
    ctx.globalAlpha = 1;
  }, [waveformData, startTime, duration]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={200}
      className="w-full h-48 border border-gray-700 rounded-lg"
    />
  );
};

interface SoundViewProps {
  trackId: number;
}

export const SoundView: React.FC<SoundViewProps> = ({ trackId }) => {
  const track = useMIDIStore((state) => state.tracks[trackId]);
  const updateTrack = useMIDIStore((state) => state.updateTrack);
  const [waveformData, setWaveformData] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (track.sample?.buffer) {
      const data = extractWaveformData(track.sample.buffer, 800);
      setWaveformData(data);
    }
  }, [track.sample?.buffer]);

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startTime = parseFloat(e.target.value);
    updateTrack(trackId, {
      sample: {
        ...track.sample!,
        startTime,
      },
    });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseFloat(e.target.value);
    updateTrack(trackId, {
      sample: {
        ...track.sample!,
        duration,
      },
    });
  };

  const maxDuration = track.sample?.buffer?.duration || 1;

  return (
    <div className="p-6">
      <h2 className="text-white text-2xl font-bold mb-4">
        Sound View - {track.name}
      </h2>

      {track.sample?.buffer ? (
        <div className="space-y-4">
          <Waveform
            waveformData={waveformData}
            startTime={track.sample.startTime}
            duration={track.sample.duration}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Start Time (s)
              </label>
              <input
                type="range"
                min="0"
                max={maxDuration}
                step="0.001"
                value={track.sample.startTime}
                onChange={handleStartTimeChange}
                className="w-full"
              />
              <span className="text-blue-400 text-sm">
                {track.sample.startTime.toFixed(3)}s
              </span>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Duration (s)
              </label>
              <input
                type="range"
                min="0.01"
                max={maxDuration}
                step="0.001"
                value={track.sample.duration}
                onChange={handleDurationChange}
                className="w-full"
              />
              <span className="text-blue-400 text-sm">
                {track.sample.duration.toFixed(3)}s
              </span>
            </div>
          </div>

          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-white font-medium mb-2">Sample Info</h3>
            <div className="text-gray-400 text-sm space-y-1">
              <p>Name: {track.sample.name}</p>
              <p>Duration: {maxDuration.toFixed(3)}s</p>
              <p>
                Sample Rate: {track.sample.buffer.sampleRate} Hz
              </p>
              <p>Channels: {track.sample.buffer.numberOfChannels}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-400">No sample loaded for this track</p>
          <p className="text-gray-500 text-sm mt-2">
            Upload a sample from the main view
          </p>
        </div>
      )}
    </div>
  );
};
