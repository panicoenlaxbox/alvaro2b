/** Scales (width, height) down so the long side is at most maxSide. Never scales up. */
export function fitWithin(width: number, height: number, maxSide: number): { width: number; height: number } {
  const longSide = Math.max(width, height);
  if (longSide <= maxSide) return { width, height };
  const scale = maxSide / longSide;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

// Photo budget: long side around 2000 px, about 300–500 KB, plus a gallery thumbnail.
export const PHOTO_MAX_SIDE = 2000;
export const PHOTO_TARGET_BYTES = 500 * 1024;
export const THUMB_MAX_SIDE = 400;
export const COVER_MAX_SIDE = 800;
