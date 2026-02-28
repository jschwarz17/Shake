import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import { toneEngine } from '../engine/ToneEngine';
import { extractWaveformData } from '../engine/SampleLoader';
import { TRACK_ID_TO_SAMPLE_URL, HH_CHH_URL, HH_OHH_URL } from '../engine/defaultSamples';
import { VoiceGenerator } from './VoiceGenerator';
import type { FMSynthParams } from '../engine/types';

const DEFAULT_STANDARD_FM_PARAMS: FMSynthParams = {
  synthType: 'standard',
  pitch: 60,
  volume: -10,
  harmonicity: 3,
  modulationIndex: 10,
  fmAttack: 0.001,
  fmDecay: 0.2,
  fmSustain: 0,
  fmRelease: 0.3,
};

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
    const safeDuration = totalDuration || 1;
    const startX = (startTime / safeDuration) * width;
    const endX = (endTime / safeDuration) * width;
    const amp = height / 2;
    const step = width / waveformData.length;

    // Base background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#0b1327');
    bg.addColorStop(0.5, '#111c37');
    bg.addColorStop(1, '#0a1224');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid for timing context
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 16; i++) {
      const x = (i / 16) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Build waveform path once
    ctx.beginPath();
    waveformData.forEach((value, i) => {
      const x = i * step;
      const y = amp - value * amp;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Fill under waveform with soft gradient
    const fillPath = new Path2D();
    fillPath.moveTo(0, amp);
    waveformData.forEach((value, i) => {
      const x = i * step;
      const y = amp - value * amp;
      if (i === 0) fillPath.moveTo(x, y);
      else fillPath.lineTo(x, y);
    });
    fillPath.lineTo(width, amp);
    fillPath.closePath();
    const underFill = ctx.createLinearGradient(0, 0, 0, height);
    underFill.addColorStop(0, 'rgba(96, 165, 250, 0.25)');
    underFill.addColorStop(1, 'rgba(96, 165, 250, 0.03)');
    ctx.fillStyle = underFill;
    ctx.fill(fillPath);

    // Waveform glow pass
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)';
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(59, 130, 246, 0.55)';
    ctx.shadowBlur = 12;
    ctx.stroke();

    // Main waveform stroke
    const lineGrad = ctx.createLinearGradient(0, 0, width, 0);
    lineGrad.addColorStop(0, '#93c5fd');
    lineGrad.addColorStop(0.5, '#60a5fa');
    lineGrad.addColorStop(1, '#3b82f6');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2.2;
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Draw center line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, amp);
    ctx.lineTo(width, amp);
    ctx.stroke();

    // Dim unselected areas + brighten selected trim region
    ctx.fillStyle = 'rgba(2, 6, 23, 0.38)';
    ctx.fillRect(0, 0, startX, height);
    ctx.fillRect(endX, 0, width - endX, height);
    const selected = ctx.createLinearGradient(startX, 0, endX, 0);
    selected.addColorStop(0, 'rgba(34, 211, 238, 0.16)');
    selected.addColorStop(0.5, 'rgba(59, 130, 246, 0.22)');
    selected.addColorStop(1, 'rgba(147, 197, 253, 0.16)');
    ctx.fillStyle = selected;
    ctx.fillRect(startX, 0, Math.max(0, endX - startX), height);

    // Draw boundary markers
    ctx.strokeStyle = '#93C5FD';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(147, 197, 253, 0.75)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();
    ctx.shadowBlur = 0;
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
  const setTrackVolume = useMIDIStore((state) => state.setTrackVolume);
  const [waveformData, setWaveformData] = React.useState<number[]>([]);
  const [audioBuffer, setAudioBuffer] = React.useState<AudioBuffer | null>(null);
  const [isLoadingSample, setIsLoadingSample] = React.useState(false);
  const [sampleError, setSampleError] = React.useState<string | null>(null);
  const isVoiceTrack = trackId === 8 || track.name.toLowerCase() === 'voice';

  React.useEffect(() => {
    let cancelled = false;
    const ensureTrackSample = async () => {
      setSampleError(null);
      const sourceUrl = track.sample?.url ?? TRACK_ID_TO_SAMPLE_URL[trackId];
      if (!sourceUrl) {
        setAudioBuffer(null);
        setWaveformData([]);
        return;
      }

      // Ensure every track has sample metadata in Sound view, even when mode is FM.
      if (!track.sample?.url) {
        updateTrack(trackId, {
          sample: {
            name: `Default ${track.name}`,
            buffer: null,
            url: sourceUrl,
            startTime: 0,
            duration: 1,
          },
        });
      }

      setIsLoadingSample(true);
      try {
        await toneEngine.loadSample(trackId, sourceUrl);
        if (cancelled) return;
        const buffer = toneEngine.getSampleBuffer(trackId);
        setAudioBuffer(buffer);
        if (buffer) {
          setWaveformData(extractWaveformData(buffer, 800));
          if ((track.sample?.duration ?? 0) <= 0 || (track.sample?.startTime ?? 0) >= buffer.duration) {
            updateTrack(trackId, {
              sample: {
                name: track.sample?.name ?? `Default ${track.name}`,
                buffer: null,
                url: sourceUrl,
                startTime: 0,
                duration: Math.max(0.01, Math.min(buffer.duration, track.sample?.duration ?? buffer.duration)),
              },
            });
          }
        } else {
          setWaveformData([]);
        }
      } catch (error) {
        if (!cancelled) {
          setSampleError(error instanceof Error ? error.message : 'Failed to load sample.');
          setAudioBuffer(null);
          setWaveformData([]);
        }
      } finally {
        if (!cancelled) setIsLoadingSample(false);
      }
    };

    void ensureTrackSample();
    return () => {
      cancelled = true;
    };
  }, [trackId, track.sample?.url, track.name, updateTrack]);

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
  const isHHTrack = trackId === 3;
  const hhVariant = (track.sampleVariant ?? 'chh') as 'chh' | 'ohh';

  const handleHHToggle = async () => {
    const nextVariant = hhVariant === 'chh' ? 'ohh' : 'chh';
    const url = nextVariant === 'chh' ? HH_CHH_URL : HH_OHH_URL;
    try {
      await toneEngine.loadSample(trackId, url);
      const loaded = toneEngine.getSampleBuffer(trackId);
      updateTrack(trackId, {
        sampleVariant: nextVariant,
        sample: {
          name: nextVariant === 'chh' ? 'HH (Closed)' : 'HH (Open)',
          buffer: null,
          url,
          startTime: 0,
          duration: loaded?.duration ?? 1,
        },
      });
      if (loaded) {
        setWaveformData(extractWaveformData(loaded, 800));
        setAudioBuffer(loaded);
      }
    } catch (e) {
      console.error('Failed to switch HH sample', e);
    }
  };

  const toggleTrackModeFromSoundView = async () => {
    const switchingToSample = track.mode === 'fm';
    if (switchingToSample) {
      const sourceUrl = track.sample?.url ?? TRACK_ID_TO_SAMPLE_URL[trackId];
      if (sourceUrl) {
        setIsLoadingSample(true);
        setSampleError(null);
        try {
          await toneEngine.loadSample(trackId, sourceUrl);
          const loaded = toneEngine.getSampleBuffer(trackId);
          const duration = loaded?.duration ?? track.sample?.duration ?? 1;
          updateTrack(trackId, {
            mode: 'sample',
            sample: {
              name: track.sample?.name ?? `Default ${track.name}`,
              buffer: null,
              url: sourceUrl,
              startTime: track.sample?.startTime ?? 0,
              duration: Math.max(0.01, duration),
            },
          });
          if (loaded) setWaveformData(extractWaveformData(loaded, 800));
          setAudioBuffer(loaded);
          return;
        } catch (error) {
          setSampleError(error instanceof Error ? error.message : 'Failed to switch to sample mode.');
        } finally {
          setIsLoadingSample(false);
        }
      }
    }
    if (switchingToSample) {
      updateTrack(trackId, { mode: 'sample' });
    } else {
      if (track.fmParams) {
        useMIDIStore.getState().toggleTrackMode(trackId);
      } else {
        updateTrack(trackId, {
          mode: 'fm',
          fmParams: { ...DEFAULT_STANDARD_FM_PARAMS, pitch: track.midiNote },
        });
      }
    }
  };

  const handleUseGeneratedVoiceSample = async (url: string, name: string, generatedDuration: number) => {
    await toneEngine.initialize();
    await toneEngine.loadSample(trackId, url);
    updateTrack(trackId, {
      mode: 'sample',
      sample: {
        name,
        buffer: null,
        url,
        startTime: 0,
        duration: Math.min(10, Math.max(0.1, generatedDuration)),
      },
    });
    const loaded = toneEngine.getSampleBuffer(trackId);
    setAudioBuffer(loaded);
    if (loaded) {
      setWaveformData(extractWaveformData(loaded, 800));
    }
  };

  const handlePreview = async () => {
    await toneEngine.initialize();
    toneEngine.triggerPad(trackId, track);
  };

  const compact = isVoiceTrack;
  return (
    <div className={compact ? 'p-2' : 'p-3 sm:p-6'}>
      {!compact && (
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-white text-2xl font-bold">
            Sound View - {track.name}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreview}
              className="modern-btn px-4 py-2 rounded-lg text-sm !border-cyan-400/70"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => void toggleTrackModeFromSoundView()}
              className="modern-btn px-4 py-2 rounded-lg text-sm"
            >
              Mode: {track.mode === 'fm' ? 'FM' : 'Sample'} (Switch)
            </button>
          </div>
        </div>
      )}
      <div className={`flex items-center gap-3 flex-wrap ${compact ? 'mb-2' : 'mb-4'}`}>
        {!compact && <span className="text-white/70 text-xs font-medium">Track volume</span>}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round((track.volume ?? 1) * 100)}
          onChange={(e) => setTrackVolume(trackId, Number(e.target.value) / 100)}
          className="w-32 accent-cyan-500"
        />
        <span className="text-cyan-300 text-sm font-mono w-10">{Math.round((track.volume ?? 1) * 100)}%</span>
        {compact && (
          <>
            <button
              type="button"
              onClick={handlePreview}
              className="modern-btn px-2 py-1 rounded text-xs !border-cyan-400/70"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => void toggleTrackModeFromSoundView()}
              className="ml-1 modern-btn px-2 py-1 rounded text-xs"
            >
              {track.mode === 'fm' ? 'FM' : 'Sample'}
            </button>
          </>
        )}
      </div>
      {isHHTrack && (
        <div className={`flex items-center gap-3 flex-wrap ${compact ? 'mb-2' : 'mb-4'}`}>
          <span className="text-white/70 text-xs font-medium">HH type</span>
          <button
            type="button"
            onClick={() => void handleHHToggle()}
            className={`modern-btn px-4 py-2 rounded-lg text-sm ${hhVariant === 'ohh' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' : ''}`}
          >
            {hhVariant === 'chh' ? 'CHH (Closed)' : 'OHH (Open)'} — tap to switch
          </button>
        </div>
      )}
      {sampleError && <div className="mb-2 text-sm text-red-300">{sampleError}</div>}

      {isVoiceTrack && (
        <div className={compact ? 'mb-2' : 'mb-4'}>
          <VoiceGenerator onUseSample={handleUseGeneratedVoiceSample} />
        </div>
      )}

      {hasSample && audioBuffer ? (
        <div className={compact ? 'space-y-2' : 'space-y-5'}>
          <div className="relative">
            <Waveform
              waveformData={waveformData}
              startTime={start}
              endTime={end}
              totalDuration={maxDuration}
              onStartChange={handleStartTimeChange}
              onEndChange={handleEndTimeChange}
            />
          </div>

          <div className={`w-full rounded border border-white/35 bg-black/85 ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
            <div className={`grid grid-cols-1 ${compact ? 'gap-2' : 'gap-3'}`}>
              <div className="min-w-0">
                <div className={`flex items-center justify-between ${compact ? 'mb-0.5' : 'mb-1'}`}>
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
                <div className={`flex items-center justify-between ${compact ? 'mb-0.5' : 'mb-1'}`}>
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

          {isVoiceTrack && (
          <div className={`w-full rounded border border-white/35 bg-black/85 ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <span className="text-xs font-semibold text-cyan-200">Chop vocal</span>
                {!compact && <p className="text-[10px] text-white/50 mt-0.5">4 even parts · each step plays one part</p>}
              </div>
              <button
                type="button"
                onClick={() => updateTrack(trackId, {
                  sample: {
                    ...track.sample!,
                    chopEnabled: !track.sample?.chopEnabled,
                  },
                })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  track.sample?.chopEnabled
                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                    : 'bg-white/10 border border-white/30 text-white/70 hover:border-white/50'
                }`}
              >
                {track.sample?.chopEnabled ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        )}

          {!compact && (
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="text-white font-medium mb-2">Sample Info</h3>
              <div className="text-gray-400 text-sm space-y-1">
                <p>Name: {track.sample?.name ?? track.name}</p>
                <p>Duration: {maxDuration.toFixed(3)}s</p>
                <p>Sample Rate: {audioBuffer.sampleRate} Hz</p>
                <p>Channels: {audioBuffer.numberOfChannels}</p>
              </div>
            </div>
          )}
        </div>
      ) : hasSample || isLoadingSample ? (
        <div className={`text-center border-2 border-dashed border-gray-700 rounded-lg ${compact ? 'py-4' : 'py-12'}`}>
          <p className="text-gray-300 text-sm">{isLoadingSample ? 'Loading...' : 'Preparing waveform...'}</p>
        </div>
      ) : (
        <div className={`text-center border-2 border-dashed border-gray-700 rounded-lg ${compact ? 'py-4' : 'py-12'}`}>
          <p className="text-gray-400 text-sm">{isVoiceTrack ? 'Generate a vocal above to begin.' : 'No sample loaded for this track'}</p>
          {!compact && (
            <p className="text-gray-500 text-sm mt-2">
              {isVoiceTrack ? 'Enter up to 10 words, set Global Key (top right), then generate.' : 'Click Play once to load defaults, or load a sample from Pad view'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
