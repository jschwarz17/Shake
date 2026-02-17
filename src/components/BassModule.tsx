import React from 'react';
import { useMIDIStore } from '../engine/MIDIStore';
import { getScaleNotes, getBassNoteRange, midiToKeyLabel } from '../engine/scaleUtils';

const BASS_TRACK_ID = 1;
const STEPS = 16;
const { lowest: LOWEST_MIDI, highest: HIGHEST_MIDI } = getBassNoteRange();
const NOTE_COUNT = HIGHEST_MIDI - LOWEST_MIDI + 1;

export const BassModule: React.FC = () => {
  const events = useMIDIStore((s) => s.events);
  const addEvent = useMIDIStore((s) => s.addEvent);
  const removeEvent = useMIDIStore((s) => s.removeEvent);
  const globalKeyRoot = useMIDIStore((s) => s.globalKeyRoot);
  const globalChordType = useMIDIStore((s) => s.globalChordType);
  const bassSubEnabled = useMIDIStore((s) => s.bassSubEnabled);
  const setBassSubEnabled = useMIDIStore((s) => s.setBassSubEnabled);
  const [chromatic, setChromatic] = React.useState(false);

  const scaleNotes = React.useMemo(
    () => getScaleNotes(globalKeyRoot, globalChordType),
    [globalKeyRoot, globalChordType]
  );

  const bassEvents = React.useMemo(
    () => events.filter((e) => e.trackId === BASS_TRACK_ID),
    [events]
  );

  const isInScale = (note: number) => chromatic || scaleNotes.has(note);

  const handleCellClick = (step: number, note: number) => {
    if (!isInScale(note)) return;
    const existing = bassEvents.find((e) => e.step === step && e.note === note);
    if (existing) {
      removeEvent(existing.id);
    } else {
      addEvent({
        trackId: BASS_TRACK_ID,
        step,
        note,
        velocity: 100,
        tick: step * 4,
        duration: 0.1,
      });
    }
  };

  const notesReversed = React.useMemo(() => {
    const arr: number[] = [];
    for (let n = HIGHEST_MIDI; n >= LOWEST_MIDI; n--) arr.push(n);
    return arr;
  }, []);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-3">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h3 className="text-lg font-bold text-white">Bass</h3>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-white/70">Sub</span>
            <button
              type="button"
              role="switch"
              aria-checked={bassSubEnabled}
              onClick={() => setBassSubEnabled(!bassSubEnabled)}
              className={`w-10 h-6 rounded-full border-2 transition-colors ${
                bassSubEnabled
                  ? 'bg-cyan-500 border-cyan-400'
                  : 'bg-black/50 border-white/30'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  bassSubEnabled ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-white/70">Chromatic</span>
            <button
              type="button"
              role="switch"
              aria-checked={chromatic}
              onClick={() => setChromatic(!chromatic)}
              className={`w-10 h-6 rounded-full border-2 transition-colors ${
                chromatic ? 'bg-cyan-500 border-cyan-400' : 'bg-black/50 border-white/30'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  chromatic ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
        </div>
      </div>
      <p className="text-[10px] text-white/50 mb-2">
        Scale: {globalKeyRoot} {globalChordType} (Global Key). {chromatic ? 'All notes allowed.' : 'Only scale notes.'}
      </p>

      <div className="flex-1 min-h-0 flex overflow-auto rounded-lg border border-white/20 bg-black/40">
        {/* Single scrollable row: piano keys + grid so they scroll together */}
        <div className="flex flex-shrink-0 min-w-full" style={{ minHeight: NOTE_COUNT * 24 }}>
          {/* Piano keys column - all 36 rows */}
          <div className="flex-shrink-0 w-14 border-r border-white/20 flex flex-col">
            {notesReversed.map((midi) => {
              const isBlack = [1, 3, 6, 8, 10].includes(midi % 12);
              const inScale = scaleNotes.has(midi);
              return (
                <div
                  key={midi}
                  className={`flex-shrink-0 flex items-center justify-end pr-1 text-[10px] font-mono border-b border-white/10 ${
                    isBlack ? 'bg-gray-800 text-white/70' : 'bg-white/5 text-white/90'
                  } ${!chromatic && !inScale ? 'opacity-50' : ''}`}
                  style={{ height: 24 }}
                >
                  {midiToKeyLabel(midi)}
                </div>
              );
            })}
          </div>

          {/* Grid - all 36 rows x 16 columns */}
          <div
            className="grid flex-1 min-w-0 gap-px p-px"
            style={{
              gridTemplateColumns: `repeat(${STEPS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${NOTE_COUNT}, 24px)`,
              height: NOTE_COUNT * 24,
            }}
          >
            {notesReversed.map((note) =>
              Array.from({ length: STEPS }, (_, step) => {
                const hasNote = bassEvents.some((e) => e.step === step && e.note === note);
                return (
                  <button
                    key={`${step}-${note}`}
                    type="button"
                    onClick={() => handleCellClick(step, note)}
                    disabled={!isInScale(note)}
                    className={`min-w-0 rounded-sm transition-colors border ${
                      hasNote
                        ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.5)] hover:bg-cyan-300'
                        : isInScale(note)
                          ? 'bg-white/15 border-white/10 hover:bg-white/30'
                          : 'bg-white/5 border-white/5 cursor-not-allowed opacity-50'
                    }`}
                    style={{ height: 23 }}
                  />
                );
              })
            ).flat()}
          </div>
        </div>
      </div>
    </div>
  );
};
