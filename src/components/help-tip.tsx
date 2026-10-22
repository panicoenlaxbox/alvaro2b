"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * A round "?" that opens a short explanation in a bubble. It works on tap (there is no hover on a phone)
 * and closes on a tap outside it or on Escape.
 */
export function HelpTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex size-6 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
          open ? "border-accent bg-accent text-ink" : "border-border text-soft hover:border-muted"
        }`}
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute top-full left-0 z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border-[3px] border-ink bg-paper p-3 text-sm text-ink shadow-hard"
        >
          {children}
        </span>
      )}
    </span>
  );
}
