import type { MIDIEvent } from '../engine/types';

/**
 * MIDI Export Utility
 * Placeholder for future MIDI file export functionality
 * 
 * To implement: Use a library like @tonejs/midi or jsmidgen
 */

export interface MIDIExportOptions {
  bpm: number;
  timeSignature: [number, number];
  trackNames: string[];
}

/**
 * Export MIDI events to a MIDI file
 * @param events - Array of MIDI events to export
 * @param options - Export options (BPM, time signature, etc.)
 * @returns Blob containing the MIDI file data
 */
export async function exportToMIDI(
  events: MIDIEvent[],
  options: MIDIExportOptions
): Promise<Blob> {
  // TODO: Implement MIDI export using @tonejs/midi or similar library
  // 
  // Basic structure:
  // 1. Create a new MIDI file object
  // 2. Set BPM and time signature
  // 3. Create tracks for each drum instrument
  // 4. Convert MIDIEvent objects to MIDI notes
  // 5. Return as Blob for download
  
  console.log('MIDI Export - To be implemented');
  console.log('Events:', events);
  console.log('Options:', options);
  
  throw new Error('MIDI export not yet implemented');
}

/**
 * Download MIDI file to user's computer
 */
export function downloadMIDIFile(blob: Blob, filename: string = 'shake-pattern.mid') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert step-based events to absolute time events for MIDI export
 */
export function convertEventsToAbsoluteTime(
  events: MIDIEvent[],
  bpm: number
): MIDIEvent[] {
  const secondsPerBeat = 60 / bpm;
  const secondsPer16th = secondsPerBeat / 4;
  
  return events.map((event) => ({
    ...event,
    tick: event.step * secondsPer16th,
  }));
}
