"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Orders a list of results: changes only the `sort` param of the current URL, leaving the filters as they are. */
export function SortSelect({ options, current, fallback }: { options: { value: string; label: string }[]; current: string; fallback: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      Orden
      <select
        value={current}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value === fallback) next.delete("sort");
          else next.set("sort", e.target.value);
          const query = next.toString();
          router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
        }}
        className="input w-auto py-1.5"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
