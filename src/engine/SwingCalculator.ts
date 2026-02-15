/**
 * Calculate swing offset for a given step
 * @param step - The step number (0-15)
 * @param bpm - Current BPM
 * @param globalSwing - Global swing amount (0-100, 50 = no swing)
 * @param trackSwing - Per-track swing amount (0-100)
 * @returns Absolute timestamp in seconds from loop start
 */
export function calculateSwingOffset(
  step: number,
  bpm: number,
  globalSwing: number,
  trackSwing: number
): number {
  // Per-track swing overrides global unless exactly centered.
  const effectiveSwing = trackSwing === 50 ? globalSwing : trackSwing;

  // 8th-note duration in seconds.
  const quarterNoteDuration = 60 / bpm;
  const eighthNoteDuration = quarterNoteDuration / 2;

  // Centered at 50 => straight timing (half of an 8th note between pair steps).
  const delayAmount = (effectiveSwing / 100) * eighthNoteDuration;

  // Steps are grouped in 8th-note pairs:
  // step 0 = odd 16th (1st of pair), step 1 = even 16th (2nd of pair), etc.
  const pairIndex = Math.floor(step / 2);
  const oddStepTime = pairIndex * eighthNoteDuration;

  // Only even-numbered 16th steps (2,4,6...) i.e. 0-based odd steps get delayed.
  if (step % 2 === 1) {
    return oddStepTime + delayAmount;
  }

  return oddStepTime;
}

/**
 * Calculate the actual timestamp for a MIDI event with swing applied
 * @param step - The step number (0-15)
 * @param bpm - Current BPM
 * @param globalSwing - Global swing amount
 * @param trackSwing - Per-track swing amount
 * @returns Timestamp in seconds from loop start
 */
export function calculateEventTimestamp(
  step: number,
  bpm: number,
  globalSwing: number,
  trackSwing: number
): number {
  return calculateSwingOffset(step, bpm, globalSwing, trackSwing);
}

/**
 * Calculate timestamps for all events in a sequence
 */
export function calculateEventTimestamps(
  events: any[],
  bpm: number,
  globalSwing: number,
  trackSwing: { [trackId: number]: number }
) {
  return events.map((event) => ({
    ...event,
    timestamp: calculateEventTimestamp(
      event.step,
      bpm,
      globalSwing,
      trackSwing[event.trackId] || 0
    ),
  }));
}
