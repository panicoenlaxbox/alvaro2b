"use client";

import { useActionState, useEffect, useState } from "react";
import { ConfirmSubmitButton, FormMessage, SubmitButton } from "@/components/form";
import { useLeavingAction } from "@/components/leave";
import { initialActionState } from "@/lib/action-state";
import { deletePlay, finishPlay } from "../actions";

function elapsed(startedAt: string, now: number): string {
  const total = Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function RunningTimer({ playId, startedAt }: { playId: string; startedAt: string }) {
  const [now, setNow] = useState<number | null>(null);
  const [state, action] = useActionState(finishPlay, initialActionState);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="card flex items-center justify-between gap-4 border-accent">
      <div>
        <p className="text-sm text-muted">En juego</p>
        <p className="text-4xl font-bold tabular-nums" aria-live="off">
          {now === null ? "--:--" : elapsed(startedAt, now)}
        </p>
      </div>
      <form action={action}>
        <input type="hidden" name="id" value={playId} />
        <SubmitButton className="btn-primary px-6 py-3 text-base" pendingText="Terminando…">
          Terminar
        </SubmitButton>
        <FormMessage state={state} />
      </form>
    </section>
  );
}

export function DeletePlayButton({ playId }: { playId: string }) {
  const [state, action] = useLeavingAction(deletePlay);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={playId} />
      <ConfirmSubmitButton confirmText="Sí, eliminar">Eliminar</ConfirmSubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
