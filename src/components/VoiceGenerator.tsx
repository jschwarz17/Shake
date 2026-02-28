import React from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useMIDIStore } from '../engine/MIDIStore';

const MAX_WORDS = 10;

const VOICE_TONES = ['Raspy', 'Airy', 'Deep bass', 'Trebly'] as const;
const VIBES = ['Moody', 'Upbeat', 'Energetic', 'Angsty', 'Emo'] as const;
const EFFECTS = [
  { id: 'Radio', label: 'Radio', prompt: 'processed to sound like it came through an old AM radio' },
  { id: 'Phone', label: 'Phone', prompt: 'processed to sound like someone singing through a 90s phone' },
  { id: 'Bullhorn', label: 'Bullhorn', prompt: 'processed to sound like singing through a bullhorn' },
  { id: 'Echo', label: 'Echo', prompt: 'with an 8th note repeating delay effect' },
  { id: 'Underwater', label: 'Underwater', prompt: 'processed to sound like singing underwater' },
] as const;

type VoiceTone = (typeof VOICE_TONES)[number];
type Vibe = (typeof VIBES)[number];
type EffectId = (typeof EFFECTS)[number]['id'];

interface VoiceGeneratorProps {
  onUseSample: (url: string, name: string, duration: number) => Promise<void>;
}

export const VoiceGenerator: React.FC<VoiceGeneratorProps> = ({ onUseSample }) => {
  const [phrase, setPhrase] = React.useState('');
  const globalKeyRoot = useMIDIStore((s) => s.globalKeyRoot);
  const globalChordType = useMIDIStore((s) => s.globalChordType);
  const [voiceTone, setVoiceTone] = React.useState<VoiceTone | null>(null);
  const [vibe, setVibe] = React.useState<Vibe | null>(null);
  const [effect, setEffect] = React.useState<EffectId | null>(null);
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
      height: 48,
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

  // Intentionally do not revoke object URLs on unmount:
  // the generated URL is stored in track.sample and should remain usable
  // when the user navigates away and back within the same session.

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
        body: JSON.stringify({
          phrase: phrase.trim(),
          note: globalKeyRoot,
          chordType: globalChordType,
          maxSeconds: 5,
          voiceTone: voiceTone ?? undefined,
          vibe: vibe ?? undefined,
          effect: effect ?? undefined,
        }),
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
      const safeDuration = Math.min(5, Math.max(0.2, metadataLoaded));
      setDuration(safeDuration);

      // Auto-load generated vocal sample into the slot immediately (module stays open so user can play preview).
      setIsApplying(true);
      await onUseSample(nextUrl, `Voice ${globalKeyRoot} ${globalChordType}`, safeDuration);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate vocal sample.');
    } finally {
      setIsApplying(false);
      setIsGenerating(false);
    }
  };

  return (
    <section className="relative isolate rounded-lg border border-cyan-400/35 bg-[linear-gradient(180deg,rgba(13,22,45,0.95)_0%,rgba(4,8,20,0.98)_100%)] p-2 shadow-[0_0_12px_rgba(34,211,238,0.12)]">
      <div className="mb-1.5">
        <h3 className="text-sm font-bold text-cyan-100">VOICE</h3>
      </div>

      <div className="space-y-1 relative z-[60] pointer-events-auto">
        <label className="text-[10px] uppercase tracking-wider text-white/60">Phrase (max 10 words)</label>
        <textarea
          value={phrase}
          onChange={(e) => handlePhraseChange(e.target.value)}
          onInput={(e) => handlePhraseChange((e.target as HTMLTextAreaElement).value)}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onFocus={(e) => e.currentTarget.select()}
          placeholder="e.g. all night long"
          rows={1}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className="relative z-[70] pointer-events-auto w-full rounded px-2 py-1.5 text-sm outline-none resize-none"
          style={{
            backgroundColor: '#0b1220',
            color: '#ffffff',
            caretColor: '#22d3ee',
            border: '1px solid rgba(255,255,255,0.25)',
          }}
        />
        <div className="text-[10px] text-white/50">{wordCount}/{MAX_WORDS} words</div>
      </div>

      <div className="mt-2 space-y-1.5">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-white/50 block mb-1">1. Tone</span>
          <div className="flex flex-wrap gap-1.5">
            {VOICE_TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setVoiceTone((v) => (v === t ? null : t))}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                  voiceTone === t
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100'
                    : 'bg-white/5 border-white/20 text-white/80 hover:border-white/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-white/50 block mb-1">2. Vibe</span>
          <div className="flex flex-wrap gap-1.5">
            {VIBES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVibe((prev) => (prev === v ? null : v))}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                  vibe === v
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100'
                    : 'bg-white/5 border-white/20 text-white/80 hover:border-white/40'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-white/50 block mb-1">3. Effects</span>
          <div className="flex flex-wrap gap-1.5">
            {EFFECTS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setEffect((e) => (e === id ? null : id))}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                  effect === id
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100'
                    : 'bg-white/5 border-white/20 text-white/80 hover:border-white/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || isApplying}
          className="modern-btn px-3 py-1.5 rounded text-xs disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : isApplying ? 'Loading...' : 'Generate'}
        </button>
        {audioUrl && (
          <button
            type="button"
            onClick={() => waveSurferRef.current?.playPause()}
            className="modern-btn px-3 py-1.5 rounded text-xs"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        )}
      </div>

      <div className="mt-1.5 text-[9px] text-white/50 leading-tight">
        {globalKeyRoot} {globalChordType}
        {voiceTone && ` · ${voiceTone.toLowerCase()}`}
        {vibe && ` · ${vibe.toLowerCase()}`}
        {effect && ` · ${effect}`}
      </div>

      {error && <div className="mt-1 text-xs text-red-300">{error}</div>}

      {audioUrl && (
        <div className="mt-2 rounded border border-white/20 bg-black/60 p-1.5">
          <div ref={waveformRef} style={{ minHeight: 48 }} />
          <div className="text-[9px] text-white/50 mt-0.5">{duration.toFixed(2)}s</div>
        </div>
      )}
    </section>
  );
};

