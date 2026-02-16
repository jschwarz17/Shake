import React from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useMIDIStore } from '../engine/MIDIStore';

const MAX_WORDS = 10;

interface VoiceGeneratorProps {
  onUseSample: (url: string, name: string, duration: number) => Promise<void>;
}

export const VoiceGenerator: React.FC<VoiceGeneratorProps> = ({ onUseSample }) => {
  const [phrase, setPhrase] = React.useState('');
  const globalKeyRoot = useMIDIStore((s) => s.globalKeyRoot);
  const globalChordType = useMIDIStore((s) => s.globalChordType);
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
        body: JSON.stringify({ phrase: phrase.trim(), note: globalKeyRoot, chordType: globalChordType, maxSeconds: 10 }),
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
      const safeDuration = Math.min(10, Math.max(0.2, metadataLoaded));
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
    <section className="relative isolate rounded-xl border border-cyan-400/35 bg-[linear-gradient(180deg,rgba(13,22,45,0.95)_0%,rgba(4,8,20,0.98)_100%)] p-3 sm:p-4 shadow-[0_0_20px_rgba(34,211,238,0.14)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base sm:text-lg font-bold text-cyan-100">VOICE MODULE</h3>
        <span className="text-[10px] uppercase tracking-widest text-cyan-300/80">ElevenLabs</span>
      </div>

      <div className="space-y-2 relative z-[60] pointer-events-auto">
        <label className="text-xs uppercase tracking-wider text-white/70">Phrase (max 10 words)</label>
        <textarea
          value={phrase}
          onChange={(e) => handlePhraseChange(e.target.value)}
          onInput={(e) => handlePhraseChange((e.target as HTMLTextAreaElement).value)}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onFocus={(e) => e.currentTarget.select()}
          placeholder="e.g. all night long"
          rows={2}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className="relative z-[70] pointer-events-auto w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
          style={{
            backgroundColor: '#0b1220',
            color: '#ffffff',
            caretColor: '#22d3ee',
            border: '1px solid rgba(255,255,255,0.25)',
          }}
        />
        <div className="text-[11px] text-white/60">{wordCount}/{MAX_WORDS} words</div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || isApplying}
          className="modern-btn px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : isApplying ? 'Loading Slot...' : 'Generate Vocal'}
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
          </>
        )}
      </div>

      <div className="mt-3 text-[11px] text-white/60">
        Prompt: Acapella vocal singing phrase in {globalKeyRoot} {globalChordType} (set in Global Key, top right), dry studio quality, short phrase (10s max).
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

