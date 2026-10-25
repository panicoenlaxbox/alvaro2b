"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { DiceIcon } from "@/components/dice-icon";
import { useDraw } from "@/components/use-draw";
import { startToday } from "@/app/(app)/sessions/actions";

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
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
          <DiceIcon className={`size-12 shrink-0 sm:size-16 ${phase === "drawing" ? "animate-spin [animation-duration:700ms]" : ""}`} />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-bold tracking-wider uppercase">{phase === "drawing" ? phrase : "El dado ha hablado"}</p>
            {/*
             * The padding, cancelled by the margin, leaves the clip room for what the Game link draws beyond its
             * line: the highlighter stroke's overshoot on every side and, on the last line, the underline.
             */}
            <p className={`font-display -m-[0.3em] overflow-hidden p-[0.3em] text-2xl leading-tight text-ellipsis sm:text-4xl ${phase === "drawing" ? "opacity-60" : ""}`}>
              {phase === "drawing" || !shown ? (
                (shown?.name ?? "…")
              ) : (
                <>
                  Hoy toca{" "}
                  <Link href={`/games/${shown.id}`} className="link">
                    {shown.name}
                  </Link>
                </>
              )}
            </p>
          </div>
          {phase === "done" && shown && (
            <div className="flex w-full flex-wrap gap-3 sm:w-auto sm:flex-col">
              <button
                type="button"
                disabled={pending}
                className="btn flex-1 bg-ink text-accent"
                onClick={() => startTransition(async () => setError((await startToday(shown.id)).error))}
              >
                {pending ? "Preparando…" : "Empezar"}
              </button>
              <button type="button" disabled={pending} className="btn flex-1 bg-accent text-ink" onClick={start}>
                Otra tirada
              </button>
            </div>
          )}
          {error && <p className="w-full text-sm font-bold">{error}</p>}
        </section>
      )}
    </div>
  );
}
