/* eslint-disable @next/next/no-img-element -- covers are signed or external URLs that change hourly */
export function Cover({ url, name, className = "size-16" }: { url: string | null; name: string; className?: string }) {
  if (url) {
    return <img src={url} alt="" loading="lazy" className={`${className} shrink-0 rounded-xl border border-border bg-card object-cover`} />;
  }
  return (
    <span
      aria-hidden
      className={`${className} inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-accent-soft text-xl font-bold text-accent`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
