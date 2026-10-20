/* eslint-disable @next/next/no-img-element -- a tiny static SVG; no optimization needed */
/** Official "Powered by BGG" logo, required wherever BGG data is shown (ADR 0002). The reversed one suits the dark background. */
export function PoweredByBgg() {
  return (
    <a href="https://boardgamegeek.com" target="_blank" rel="noreferrer" className="inline-block">
      <img src="/powered-by-bgg-reversed-rgb.svg" alt="Powered by BGG" width={126} height={28} className="h-7 w-auto" />
    </a>
  );
}
