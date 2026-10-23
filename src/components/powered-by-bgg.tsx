/* eslint-disable @next/next/no-img-element -- a tiny static SVG; no optimization needed */
/** Link to a Game's BoardGameGeek page, with the official logo. The reversed one suits the dark background. */
export function PoweredByBgg({ href }: { href: string }) {
  const label = "Ver en BoardGameGeek";
  return (
    <a href={href} target="_blank" rel="noreferrer" title={label} className="inline-block">
      <img src="/powered-by-bgg-reversed-rgb.svg" alt={label} width={126} height={28} className="h-7 w-auto" />
    </a>
  );
}
