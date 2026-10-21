"use client";

import Link from "next/link";
import { useState } from "react";

export type RankingItem = { href: string; label: string };

/**
 * A ranking line whose count opens what it counts: with one Play or Session it links straight to
 * it, with more it unfolds the list under the line. Without items the count is plain text.
 */
export function RankingRow({ position, name, count, items }: { position: number; name: React.ReactNode; count: string; items: RankingItem[] }) {
  const [open, setOpen] = useState(false);
  const only = items.length === 1 ? items[0] : undefined;

  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center">
          <span className="inline-block w-6 shrink-0 text-muted">{position}.</span>
          {name}
        </span>
        {items.length === 0 ? (
          <span className="tabular-nums text-muted">{count}</span>
        ) : only ? (
          <Link href={only.href} className="tabular-nums text-muted underline hover:text-foreground">
            {count}
          </Link>
        ) : (
          <button
            type="button"
            className="tabular-nums text-muted underline hover:text-foreground"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {count} {open ? "▴" : "▾"}
          </button>
        )}
      </div>
      {open && !only && (
        <ul className="flex flex-wrap justify-end gap-x-3 gap-y-1 pl-6 text-xs">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="text-muted underline hover:text-foreground">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
