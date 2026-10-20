"use client";

import Link from "next/link";
import { useState } from "react";
import { pickRandom } from "@/lib/domain/explore";

export function SurpriseMe({ games }: { games: { id: string; name: string }[] }) {
  const [picked, setPicked] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="space-y-2">
      <button type="button" className="btn-secondary w-full" onClick={() => setPicked(pickRandom(games))}>
        🎲 Sorpréndeme
      </button>
      {picked && (
        <Link href={`/games/${picked.id}`} className="card block border-accent text-center" aria-live="polite">
          <span className="text-sm text-muted">Hoy toca…</span>
          <span className="block text-xl font-bold">{picked.name}</span>
        </Link>
      )}
    </div>
  );
}
