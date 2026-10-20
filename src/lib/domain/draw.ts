/**
 * Delays (ms) between the names shown during a draw: they grow linearly, so the names slow
 * down like a wheel before stopping, and add up to `totalMs`.
 */
export function drawTicks(totalMs: number, steps: number): number[] {
  const unit = (2 * totalMs) / (steps * (steps + 1));
  return Array.from({ length: steps }, (_, i) => Math.round(unit * (i + 1)));
}
