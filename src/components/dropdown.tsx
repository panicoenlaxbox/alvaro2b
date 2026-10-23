"use client";

import { useRef, type ReactNode } from "react";
import { useDismiss } from "@/components/use-dismiss";

/**
 * A menu built on <details>. Dropdowns sharing a group close each other (the `name` attribute),
 * and an open one closes on a click outside it, on Escape, or when one of its links is chosen.
 */
export function Dropdown({ group, summary, summaryClassName, children }: { group: string; summary: ReactNode; summaryClassName: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useDismiss(ref, true, () => {
    if (ref.current?.open) ref.current.open = false;
  });

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
