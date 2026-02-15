import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import { toneEngine } from '../engine/ToneEngine';
import { extractWaveformData } from '../engine/SampleLoader';

interface WaveformProps {
  waveformData: number[];
  startTime: number;
  endTime: number;
  totalDuration: number;
  onStartChange: (nextStart: number) => void;
  onEndChange: (nextEnd: number) => void;
}

const Waveform: React.FC<WaveformProps> = ({
  waveformData,
  startTime,
  endTime,
  totalDuration,
  onStartChange,
  onEndChange,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState<'start' | 'end' | null>(null);
  const minGap = 0.01;

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

    // Draw selected region between start and end
    ctx.fillStyle = '#3B82F6'; // blue-500
    ctx.globalAlpha = 0.3;
    const safeDuration = totalDuration || 1;
    const startX = (startTime / safeDuration) * width;
    const endX = (endTime / safeDuration) * width;
    ctx.fillRect(startX, 0, Math.max(0, endX - startX), height);

    // Draw boundary markers
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#93C5FD';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();
  }, [waveformData, startTime, endTime, totalDuration]);

  const timeFromClientX = React.useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * totalDuration;
  }, [totalDuration]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const nextTime = timeFromClientX(e.clientX);
    if (dragging === 'start') {
      onStartChange(Math.min(nextTime, endTime - minGap));
      return;
    }
    onEndChange(Math.max(nextTime, startTime + minGap));
  };

  const startPercent = totalDuration > 0 ? (startTime / totalDuration) * 100 : 0;
  const endPercent = totalDuration > 0 ? (endTime / totalDuration) * 100 : 100;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-48 border border-gray-700 rounded-lg overflow-hidden touch-none select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={() => setDragging(null)}
      onPointerCancel={() => setDragging(null)}
      onPointerLeave={() => setDragging(null)}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="w-full h-full"
      />

      <div className="absolute top-2 left-2 text-[11px] bg-black/70 px-2 py-0.5 rounded border border-white/20">
        Start {startTime.toFixed(3)}s
      </div>
      <div className="absolute top-2 right-2 text-[11px] bg-black/70 px-2 py-0.5 rounded border border-white/20">
        End {endTime.toFixed(3)}s
      </div>

      <div
        className="absolute top-0 bottom-0 w-[2px] bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.85)] cursor-ew-resize z-20"
        style={{ left: `calc(${startPercent}% - 1px)` }}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-4 h-8 border border-cyan-200 bg-cyan-400/20 rounded"
          onPointerDown={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            setDragging('start');
          }}
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-[2px] bg-blue-200 shadow-[0_0_8px_rgba(147,197,253,0.9)] cursor-ew-resize z-20"
        style={{ left: `calc(${endPercent}% - 1px)` }}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-4 h-8 border border-blue-100 bg-blue-300/20 rounded"
          onPointerDown={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            setDragging('end');
          }}
        />
      </div>
    </div>
  );
};

interface SoundViewProps {
  trackId: number;
}

export const SoundView: React.FC<SoundViewProps> = ({ trackId }) => {
  const track = useMIDIStore((state) => state.tracks[trackId]);
  const updateTrack = useMIDIStore((state) => state.updateTrack);
  const [waveformData, setWaveformData] = React.useState<number[]>([]);
  const [audioBuffer, setAudioBuffer] = React.useState<AudioBuffer | null>(null);

  React.useEffect(() => {
    const checkBuffer = () => {
      const buffer = toneEngine.getSampleBuffer(trackId);
      setAudioBuffer(buffer);
      if (buffer) {
        setWaveformData(extractWaveformData(buffer, 800));
        return true;
      }
      setWaveformData([]);
      return false;
    };

    if (!checkBuffer() && track.sample?.url) {
      const id = setInterval(() => {
        if (checkBuffer()) clearInterval(id);
      }, 300);
      return () => clearInterval(id);
    }
  }, [trackId, track.sample?.url]);

  const maxDuration = audioBuffer?.duration ?? track.sample?.duration ?? 1;
  const start = track.sample?.startTime ?? 0;
  const end = Math.min(maxDuration, start + (track.sample?.duration ?? maxDuration));

  const handleStartTimeChange = (nextStart: number) => {
    const clampedStart = Math.min(nextStart, end - 0.01);
    updateTrack(trackId, {
      sample: {
        ...track.sample!,
        startTime: clampedStart,
        duration: Math.max(0.01, end - clampedStart),
      },
    });
  };

  const handleEndTimeChange = (nextEnd: number) => {
    const clampedEnd = Math.max(start + 0.01, Math.min(maxDuration, nextEnd));
    updateTrack(trackId, {
      sample: {
        ...track.sample!,
        duration: Math.max(0.01, clampedEnd - start),
      },
    });
  };

  const hasSample = !!audioBuffer || !!track.sample?.url;
  const startPercent = maxDuration > 0 ? (start / maxDuration) * 100 : 0;
  const endPercent = maxDuration > 0 ? (end / maxDuration) * 100 : 100;

  return (
    <div className="p-3 sm:p-6">
      <h2 className="text-white text-2xl font-bold mb-4">
        Sound View - {track.name}
      </h2>

      {hasSample && audioBuffer ? (
        <div className="space-y-4">
          <div className="relative">
            <Waveform
              waveformData={waveformData}
              startTime={start}
              endTime={end}
              totalDuration={maxDuration}
              onStartChange={handleStartTimeChange}
              onEndChange={handleEndTimeChange}
            />
            <div
              className="absolute top-0 bottom-0 w-[3px] bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.95)] pointer-events-none z-30"
              style={{ left: `calc(${startPercent}% - 1.5px)` }}
            />
            <div
              className="absolute top-0 bottom-0 w-[3px] bg-blue-200 shadow-[0_0_12px_rgba(147,197,253,0.95)] pointer-events-none z-30"
              style={{ left: `calc(${endPercent}% - 1.5px)` }}
            />

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 w-[min(92%,720px)] rounded-md border border-white/35 bg-black/80 px-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-cyan-200">Start</span>
                    <span className="text-xs tabular-nums text-cyan-100">{start.toFixed(3)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, end - 0.01)}
                    step="0.001"
                    value={start}
                    onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-blue-200">End</span>
                    <span className="text-xs tabular-nums text-blue-100">{end.toFixed(3)}s</span>
                  </div>
                  <input
                    type="range"
                    min={start + 0.01}
                    max={maxDuration}
                    step="0.001"
                    value={end}
                    onChange={(e) => handleEndTimeChange(parseFloat(e.target.value))}
                    className="w-full accent-blue-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-white font-medium mb-2">Sample Info</h3>
            <div className="text-gray-400 text-sm space-y-1">
              <p>Name: {track.sample?.name ?? track.name}</p>
              <p>Duration: {maxDuration.toFixed(3)}s</p>
              <p>
                Sample Rate: {audioBuffer.sampleRate} Hz
              </p>
              <p>Channels: {audioBuffer.numberOfChannels}</p>
            </div>
          </div>
        </div>
      ) : hasSample ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-300">Loading sample waveform...</p>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-400">No sample loaded for this track</p>
          <p className="text-gray-500 text-sm mt-2">
            Click Play once to load defaults, or load a sample from Pad view
          </p>
        </div>
      )}
    </div>
  );
};
