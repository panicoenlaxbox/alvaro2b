/* eslint-disable @next/next/no-img-element -- a tiny static SVG; no optimization needed */
/** Official "Powered by BGG" logo, required wherever BGG data is shown (ADR 0002). The reversed one suits the dark background. */
export function PoweredByBgg({ href = "https://boardgamegeek.com", label = "Powered by BGG" }: { href?: string; label?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" title={label} className="inline-block">
      <img src="/powered-by-bgg-reversed-rgb.svg" alt={label} width={126} height={28} className="h-7 w-auto" />
    </a>
  );
}
