"use client";

import Link from "next/link";
import { useDraw } from "@/components/use-draw";

const PHRASES = [
  "Barajando el catálogo…",
  "Consultando a los dados…",
  "Sacudiendo la caja…",
  "Contando meeples…",
  "Haciendo tiempo…",
  "Calculando probabilidades dudosas…",
  "Leyéndose las reglas…",
  "Casi lo tengo…",
];

export function SurpriseMe({ games }: { games: { id: string; name: string }[] }) {
  const { phase, shown, phrase, start } = useDraw(games, PHRASES);

  return (
    <div className="space-y-2">
      <button type="button" className="btn-secondary w-full" disabled={phase === "drawing"} onClick={start}>
        {phase === "drawing" ? "🎲 Sorteando…" : phase === "done" ? "🎲 Otra vez" : "🎲 Sorpréndeme"}
      </button>
      {phase === "drawing" && (
        <div className="card text-center" aria-live="polite">
          <span className="text-sm text-muted">{phrase}</span>
          <span className="block text-xl font-bold opacity-60">{shown?.name ?? "…"}</span>
        </div>
      )}
      {phase === "done" && shown && (
        <Link href={`/games/${shown.id}`} className="card block border-accent text-center" aria-live="polite">
          <span className="text-sm text-muted">Hoy toca…</span>
          <span className="block text-xl font-bold">{shown.name}</span>
        </Link>
      )}
    </div>
  );
}
