"use client";

import { useState } from "react";

/** Five stars that set a minimum Rating in a filters form: tap one for "this many or more", tap it again to clear. */
export function StarFilter({ name, stars }: { name: string; stars: number }) {
  const [value, setValue] = useState(Math.round(stars));
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Valoración mínima">
      <input type="hidden" name={name} value={value || ""} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => setValue(n === value ? 0 : n)}
          aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"} o más`}
          aria-pressed={n <= value}
          className={`text-3xl leading-none ${n <= value ? "text-accent" : "text-border"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
