"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A menu built on <details>. Dropdowns sharing a group close each other (the `name` attribute),
 * and an open one closes on a click outside it, on Escape, or when one of its links is chosen.
 */
export function Dropdown({ group, summary, summaryClassName, children }: { group: string; summary: ReactNode; summaryClassName: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = (event: Event) => {
      const details = ref.current;
      if (!details?.open) return;
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !details.contains(event.target as Node)) details.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  return (
    <details
      ref={ref}
      name={group}
      className="relative"
      onClick={(event) => {
        if ((event.target as Element).closest("a")) event.currentTarget.open = false;
      }}
    >
      <summary className={`${summaryClassName} cursor-pointer list-none`}>{summary}</summary>
      {children}
    </details>
  );
}
