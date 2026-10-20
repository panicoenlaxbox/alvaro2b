/* eslint-disable @next/next/no-img-element -- covers are signed or external URLs that change hourly */
import { tint } from "./tint";

export function Cover({ url, name, className = "size-16 text-2xl" }: { url: string | null; name: string; className?: string }) {
  if (url) {
    return <img src={url} alt="" loading="lazy" className={`${className} shrink-0 rounded-xl border-[3px] border-ink bg-surface object-cover`} />;
  }
  return (
    <span
      aria-hidden
      className={`${className} inline-flex shrink-0 items-center justify-center rounded-xl border-[3px] border-ink font-display text-paper [text-shadow:2px_2px_0_var(--ink)]`}
      style={{ background: tint(name) }}
    >
      {name.replace(/^[¡¿]/, "").slice(0, 1).toUpperCase()}
    </span>
  );
}
