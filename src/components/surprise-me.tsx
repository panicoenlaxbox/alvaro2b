"use client";

import Link from "next/link";
import { DiceIcon } from "@/components/dice-icon";
import { useDraw } from "@/components/use-draw";

const PHRASES = [
  "Barajando el catálogo…",
  "Consultando a los dados…",
  "Sacudiendo la caja…",
  "Contando meeples…",
  "Haciendo tiempo…",
  "Calculando probabilidades dudosas…",
  "Leyendo las reglas…",
  "Casi lo tengo…",
];

/** "¡Tira el dado!": a random Game among the given ones. */
export function SurpriseMe({ games }: { games: { id: string; name: string }[] }) {
  const { phase, shown, phrase, start } = useDraw(games, PHRASES);

  return (
    <div className="space-y-4">
      {phase === "idle" && (
        <button type="button" className="btn-hot min-h-16 w-full px-7 text-xl shadow-hard-lg sm:w-auto" onClick={start}>
          <DiceIcon className="size-7" />
          ¡Tira el dado!
        </button>
      )}
      {phase !== "idle" && (
        <section aria-live="polite" className="flex flex-wrap items-center gap-4 rounded-2xl border-[3px] border-ink bg-accent p-4 text-ink shadow-hard-lg sm:p-6">
          <DiceIcon className={`size-16 shrink-0 ${phase === "drawing" ? "animate-spin [animation-duration:700ms]" : ""}`} />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-bold tracking-wider uppercase">{phase === "drawing" ? phrase : "El dado ha hablado"}</p>
            <p className={`font-display text-3xl leading-tight sm:text-4xl ${phase === "drawing" ? "opacity-60" : ""}`}>
              {phase === "drawing" ? (shown?.name ?? "…") : `Hoy toca ${shown?.name}`}
            </p>
          </div>
          {phase === "done" && shown && (
            <div className="flex w-full flex-wrap gap-3 sm:w-auto sm:flex-col">
              <Link href={`/games/${shown.id}`} className="btn flex-1 bg-ink text-accent">
                Ver ficha
              </Link>
              <button type="button" className="btn flex-1 bg-accent text-ink" onClick={start}>
                Otra tirada
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
