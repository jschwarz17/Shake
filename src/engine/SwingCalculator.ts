/**
 * Calculate swing offset for a given step
 * @param step - The step number (0-15)
 * @param globalSwing - Global swing amount (0-100, 50 = no swing)
 * @param trackSwing - Per-track swing amount (0-100)
 * @returns Swing offset as a fraction of step duration
 */
export function calculateSwingOffset(
  step: number,
  globalSwing: number,
  trackSwing: number
): number {
  // Only apply swing to odd-numbered steps (1, 3, 5, 7, 9, 11, 13, 15)
  if (step % 2 === 0) return 0;
  
  // Combine global and track swing (average them)
  const combinedSwing = (globalSwing + trackSwing) / 2;
  
  // Convert to -1 to +1 range (50 = 0)
  const swingAmount = (combinedSwing - 50) / 50;
  
  // Maximum offset is 50% of step duration
  const maxOffset = 0.5;
  
  return swingAmount * maxOffset;
}

/**
 * Calculate the actual timestamp for a MIDI event with swing applied
 * @param step - The step number (0-15)
 * @param globalSwing - Global swing amount
 * @param trackSwing - Per-track swing amount
 * @returns Timestamp in Tone.js time format (e.g., "0:0:0")
 */
export function calculateEventTimestamp(
  step: number,
  globalSwing: number,
  trackSwing: number
): string {
  // Calculate base position (16th notes)
  const sixteenthNote = step;
  
  // Calculate swing offset
  const swingOffset = calculateSwingOffset(step, globalSwing, trackSwing);
  
  // Apply swing offset to the 16th note position
  const adjustedSixteenths = sixteenthNote + swingOffset;
  
  // Convert to Tone.js format: "bars:quarters:sixteenths"
  const bars = 0;
  const quarters = Math.floor(adjustedSixteenths / 4);
  const sixteenths = adjustedSixteenths % 4;
  
  return `${bars}:${quarters}:${sixteenths}`;
}

/**
 * Calculate timestamps for all events in a sequence
 */
export function calculateEventTimestamps(
  events: any[],
  globalSwing: number,
  trackSwing: { [trackId: number]: number }
) {
  return events.map((event) => ({
    ...event,
    timestamp: calculateEventTimestamp(
      event.step,
      globalSwing,
      trackSwing[event.trackId] || 0
    ),
  }));
}
