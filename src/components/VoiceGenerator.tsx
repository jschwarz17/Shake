import React from 'react';
import WaveSurfer from 'wavesurfer.js';

const NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
const CHORD_TYPES = ['Major', 'Minor', 'Major7', 'Minor7', 'Dominant7', 'Sus4', 'Diminished'] as const;

const MAX_WORDS = 10;

interface ScrollWheelProps {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}

const ScrollWheel: React.FC<ScrollWheelProps> = ({ label, options, value, onChange }) => {
  const currentIndex = Math.max(0, options.findIndex((o) => o === value));
  const rows = [-2, -1, 0, 1, 2].map((offset) => {
    const nextIndex = (currentIndex + offset + options.length) % options.length;
    return { option: options[nextIndex], isActive: offset === 0 };
  });

  const shift = (direction: 1 | -1) => {
    const next = (currentIndex + direction + options.length) % options.length;
    onChange(options[next]);
  };

  return (
    <div className="rounded-xl border border-white/20 bg-[#0b1120] p-2">
      <div className="text-[10px] uppercase tracking-wider text-white/70 mb-1">{label}</div>
      <div
        className="relative h-40 overflow-hidden rounded-md bg-black/40 border border-white/15"
        onWheel={(e) => {
          e.preventDefault();
          shift(e.deltaY > 0 ? 1 : -1);
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 border-y border-cyan-300/60 bg-cyan-400/10" />
        <div className="h-full flex flex-col justify-center">
          {rows.map(({ option, isActive }, idx) => (
            <div
              key={`${option}-${idx}`}
              role="button"
              tabIndex={0}
              onClick={() => onChange(option)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onChange(option);
              }}
              className={`h-8 flex items-center justify-center text-base tracking-wide transition-colors select-none ${
                isActive ? 'text-cyan-100 font-semibold' : 'text-white/65'
              }`}
            >
              {option}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 text-[10px] text-white/50">Scroll wheel or tap row</div>
    </div>
  );
};

interface VoiceGeneratorProps {
  onUseSample: (url: string, name: string, duration: number) => Promise<void>;
}

export const VoiceGenerator: React.FC<VoiceGeneratorProps> = ({ onUseSample }) => {
  const [phrase, setPhrase] = React.useState('');
  const [note, setNote] = React.useState<string>('C');
  const [chordType, setChordType] = React.useState<string>('Minor');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [duration, setDuration] = React.useState<number>(5);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isApplying, setIsApplying] = React.useState(false);

  const waveformRef = React.useRef<HTMLDivElement | null>(null);
  const waveSurferRef = React.useRef<WaveSurfer | null>(null);

  const wordCount = React.useMemo(
    () => phrase.trim().split(/\s+/).filter(Boolean).length,
    [phrase]
  );

  React.useEffect(() => {
    if (!audioUrl || !waveformRef.current) return;

    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
      waveSurferRef.current = null;
    }

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#60A5FA',
      progressColor: '#22d3ee',
      cursorColor: '#93C5FD',
      height: 96,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      dragToSeek: true,
      autoScroll: true,
      autoCenter: true,
    });

    ws.load(audioUrl);
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));
    waveSurferRef.current = ws;

    return () => {
      ws.destroy();
      if (waveSurferRef.current === ws) {
        waveSurferRef.current = null;
      }
    };
  }, [audioUrl]);

  React.useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handlePhraseChange = (next: string) => {
    const words = next.trim().split(/\s+/).filter(Boolean);
    if (words.length <= MAX_WORDS) {
      setPhrase(next);
      return;
    }
    setPhrase(words.slice(0, MAX_WORDS).join(' '));
  };

  const handleGenerate = async () => {
    setError(null);
    if (!phrase.trim()) {
      setError('Enter a phrase first.');
      return;
    }
    if (wordCount > MAX_WORDS) {
      setError(`Phrase must be ${MAX_WORDS} words or fewer.`);
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/elevenlabs-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: phrase.trim(), note, chordType, maxSeconds: 10 }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Generation failed');
      }

      const blob = await res.blob();
      const nextUrl = URL.createObjectURL(blob);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(nextUrl);

      const audio = new Audio(nextUrl);
      const metadataLoaded = await new Promise<number>((resolve) => {
        audio.onloadedmetadata = () => resolve(audio.duration || 5);
        audio.onerror = () => resolve(5);
      });
      setDuration(Math.min(10, Math.max(0.2, metadataLoaded)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate vocal sample.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!audioUrl) return;
    setIsApplying(true);
    setError(null);
    try {
      await onUseSample(audioUrl, `Voice ${note} ${chordType}`, Math.min(10, duration));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply voice sample.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <section className="rounded-xl border border-cyan-400/35 bg-[linear-gradient(180deg,rgba(13,22,45,0.95)_0%,rgba(4,8,20,0.98)_100%)] p-3 sm:p-4 shadow-[0_0_20px_rgba(34,211,238,0.14)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base sm:text-lg font-bold text-cyan-100">VOICE MODULE</h3>
        <span className="text-[10px] uppercase tracking-widest text-cyan-300/80">ElevenLabs</span>
      </div>

      <div className="space-y-2 relative z-20 pointer-events-auto">
        <label className="text-xs uppercase tracking-wider text-white/70">Phrase (max 10 words)</label>
        <input
          type="text"
          value={phrase}
          onChange={(e) => handlePhraseChange(e.target.value)}
          onInput={(e) => handlePhraseChange((e.target as HTMLInputElement).value)}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="e.g. all night long"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className="relative z-30 pointer-events-auto w-full h-11 rounded-lg bg-black/70 border border-white/25 px-3 py-2 text-sm !text-white outline-none focus:border-cyan-300/70"
        />
        <div className="text-[11px] text-white/60">{wordCount}/{MAX_WORDS} words</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <ScrollWheel label="Note" options={NOTES} value={note} onChange={setNote} />
        <ScrollWheel label="Chord Type" options={CHORD_TYPES} value={chordType} onChange={setChordType} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="modern-btn px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Vocal'}
        </button>
        {audioUrl && (
          <>
            <button
              type="button"
              onClick={() => waveSurferRef.current?.playPause()}
              className="modern-btn px-4 py-2 rounded-lg text-sm"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying}
              className="modern-btn px-4 py-2 rounded-lg text-sm border !border-cyan-300/70 shadow-[0_0_14px_rgba(34,211,238,0.2)] disabled:opacity-50"
            >
              {isApplying ? 'Loading...' : 'Load To Slot'}
            </button>
          </>
        )}
      </div>

      <div className="mt-3 text-[11px] text-white/60">
        Prompt: Acapella vocal singing phrase in {note} {chordType}, dry studio quality, short phrase (10s max).
      </div>

      {error && <div className="mt-2 text-sm text-red-300">{error}</div>}

      {audioUrl && (
        <div className="mt-3 rounded-lg border border-white/20 bg-black/60 p-2">
          <div ref={waveformRef} />
          <div className="text-[11px] text-white/60 mt-1">Preview length: {duration.toFixed(2)}s (trimmed to 10s max on load)</div>
        </div>
      )}
    </section>
  );
};

