import { create } from 'zustand';
import type { MIDIEvent, Track, SequencerState } from './types';
import { DEFAULT_TRACKS } from './defaultTracks';

interface MIDIStore extends SequencerState {
  globalKeyRoot: string;
  globalChordType: string;
  bassSubEnabled: boolean;

  // DJ effects
  freezeActive: boolean;
  freezeStep: number;
  halfActive: boolean;

  // Sequence pages (up to 6)
  pages: MIDIEvent[][];
  currentPageIndex: number;

  // Actions
  addEvent: (event: Omit<MIDIEvent, 'id'>) => void;
  removeEvent: (eventId: string) => void;
  updateEvent: (eventId: string, updates: Partial<MIDIEvent>) => void;
  toggleStep: (trackId: number, step: number) => void;
  clearTrack: (trackId: number) => void;
  clearAllTracks: () => void;
  
  // Track actions
  updateTrack: (trackId: number, updates: Partial<Track>) => void;
  toggleMute: (trackId: number) => void;
  toggleSolo: (trackId: number) => void;
  setTrackVolume: (trackId: number, volume: number) => void;
  setTrackSwing: (trackId: number, swing: number) => void;
  toggleTrackMode: (trackId: number) => void;
  
  // Global actions
  setBPM: (bpm: number) => void;
  setGlobalSwing: (swing: number) => void;
  setCurrentStep: (step: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  loadPreset: (events: MIDIEvent[]) => void;
  setGlobalKeyRoot: (root: string) => void;
  setGlobalChordType: (chordType: string) => void;
  setBassSubEnabled: (enabled: boolean) => void;

  // DJ effect actions
  toggleFreeze: () => void;
  toggleHalf: () => void;

  // Page actions
  createNewPage: () => void;
  setCurrentPage: (index: number) => void;
  
  // Utility
  getTrackEvents: (trackId: number) => MIDIEvent[];
  hasAnyActiveEvents: () => boolean;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useMIDIStore = create<MIDIStore>((set, get) => ({
  // Initial state
  bpm: 120,
  globalSwing: 50,
  tracks: DEFAULT_TRACKS,
  events: [],
  currentStep: 0,
  isPlaying: false,
  globalKeyRoot: 'C',
  globalChordType: 'Minor',
  bassSubEnabled: false,
  freezeActive: false,
  freezeStep: 0,
  halfActive: false,
  pages: [[]],
  currentPageIndex: 0,
  
  // Event actions
  addEvent: (event) => {
    const newEvent: MIDIEvent = {
      ...event,
      id: generateId(),
    };
    set((state) => ({
      events: [...state.events, newEvent],
    }));
  },
  
  removeEvent: (eventId) => {
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
    }));
  },
  
  updateEvent: (eventId, updates) => {
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId ? { ...e, ...updates } : e
      ),
    }));
  },
  
  toggleStep: (trackId, step) => {
    const existingEvent = get().events.find(
      (e) => e.trackId === trackId && e.step === step
    );
    
    if (existingEvent) {
      get().removeEvent(existingEvent.id);
    } else {
      const track = get().tracks[trackId];
      get().addEvent({
        trackId,
        step,
        note: track.midiNote,
        velocity: 100,
        tick: step * 4, // 16th notes
        duration: 0.1,
      });
    }
  },
  
  clearTrack: (trackId) => {
    set((state) => ({
      events: state.events.filter((e) => e.trackId !== trackId),
    }));
  },
  
  clearAllTracks: () => {
    set({ events: [] });
  },
  
  // Track actions
  updateTrack: (trackId, updates) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, ...updates } : t
      ),
    }));
  },
  
  toggleMute: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, mute: !t.mute } : t
      ),
    }));
  },
  
  toggleSolo: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, solo: !t.solo } : t
      ),
    }));
  },
  
  setTrackVolume: (trackId, volume) => {
    get().updateTrack(trackId, { volume });
  },
  
  setTrackSwing: (trackId, swing) => {
    get().updateTrack(trackId, { swing });
  },
  
  toggleTrackMode: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? { ...t, mode: t.mode === 'sample' ? 'fm' : 'sample' }
          : t
      ),
    }));
  },
  
  // Global actions
  setBPM: (bpm) => {
    set({ bpm: Math.max(60, Math.min(240, bpm)) });
  },
  
  setGlobalSwing: (swing) => {
    set({ globalSwing: Math.max(0, Math.min(100, swing)) });
  },
  
  setCurrentStep: (step) => {
    set({ currentStep: step % 16 });
  },
  
  setIsPlaying: (isPlaying) => {
    set({ isPlaying });
  },
  
  loadPreset: (events) => {
    set({ events });
  },
  
  setGlobalKeyRoot: (root) => {
    set({ globalKeyRoot: root });
  },
  
  setGlobalChordType: (chordType) => {
    set({ globalChordType: chordType });
  },
  
  setBassSubEnabled: (enabled) => {
    set({ bassSubEnabled: enabled });
  },

  toggleFreeze: () => {
    set((state) => {
      if (state.freezeActive) {
        return { freezeActive: false };
      }
      return { freezeActive: true, freezeStep: state.currentStep };
    });
  },

  toggleHalf: () => {
    set((state) => ({ halfActive: !state.halfActive }));
  },

  createNewPage: () => {
    set((state) => {
      if (state.pages.length >= 6) return {};
      const newPages = [...state.pages];
      newPages[state.currentPageIndex] = [...state.events];
      const kickSnareEvents = state.events
        .filter((e) => e.trackId === 0 || e.trackId === 2)
        .map((e) => ({ ...e, id: generateId() }));
      newPages.push(kickSnareEvents);
      return {
        pages: newPages,
        currentPageIndex: newPages.length - 1,
        events: kickSnareEvents,
      };
    });
  },

  setCurrentPage: (index) => {
    set((state) => {
      if (index < 0 || index >= state.pages.length || index === state.currentPageIndex) return {};
      const newPages = [...state.pages];
      newPages[state.currentPageIndex] = [...state.events];
      return {
        pages: newPages,
        currentPageIndex: index,
        events: newPages[index],
      };
    });
  },

  // Utility
  getTrackEvents: (trackId) => {
    return get().events.filter((e) => e.trackId === trackId);
  },
  
  hasAnyActiveEvents: () => {
    return get().events.length > 0;
  },
}));
