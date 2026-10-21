"use client";

import { DiceIcon } from "@/components/dice-icon";
import { useDraw } from "@/components/use-draw";

const PHRASES = [
  "Lanzando el dado de inicio…",
  "Mirando quién tiene cara de empezar…",
  "Repartiendo el turno…",
  "Buscando al más impaciente…",
  "Haciendo tiempo…",
  "Casi lo tengo…",
];

/** "¿Quién empieza?": draws a first player among the selected Participants. Nothing is saved. */
export function FirstPlayerDraw({ names }: { names: string[] }) {
  const { phase, shown, phrase, start } = useDraw(names, PHRASES);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="btn-secondary" disabled={phase === "drawing"} onClick={start}>
        <DiceIcon className={`size-5 ${phase === "drawing" ? "animate-spin [animation-duration:700ms]" : ""}`} />
        {phase === "drawing" ? "Sorteando…" : "¿Quién empieza?"}
      </button>
      <p className="text-sm" aria-live="polite">
        {phase === "drawing" && (
          <>
            <span className="text-muted">{phrase}</span> <span className="font-semibold opacity-60">{shown}</span>
          </>
        )}
        {phase === "done" && (
          <>
            Empieza <span className="font-bold text-accent">{shown}</span>
          </>
        )}
      </p>
    </div>
  );
}
