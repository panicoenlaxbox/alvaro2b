/* eslint-disable @next/next/no-img-element -- a tiny static SVG; no optimization needed */
/** Official "Powered by BGG" logo, required wherever BGG data is shown (ADR 0002). The reversed one is for dark mode. */
export function PoweredByBgg() {
  return (
    <a href="https://boardgamegeek.com" target="_blank" rel="noreferrer" className="inline-block">
      <picture>
        <source srcSet="/powered-by-bgg-reversed-rgb.svg" media="(prefers-color-scheme: dark)" />
        <img src="/powered-by-bgg-rgb.svg" alt="Powered by BGG" width={126} height={28} className="h-7 w-auto" />
      </picture>
    </a>
  );
}
