const TINTS = ["#f4b940", "#3cc4b0", "#ef6f4c", "#5b8def", "#c46bd8", "#8fd16a"];

/** A stable colour from the palette for a name, so a Player or Game keeps its colour everywhere. */
export function tint(name: string): string {
  // FNV-1a
  let hash = 2166136261;
  for (const char of name) hash = Math.imul(hash ^ char.codePointAt(0)!, 16777619);
  return TINTS[(hash >>> 0) % TINTS.length]!;
}
