"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton, FormMessage, SubmitButton, useRowAction } from "@/components/form";
import { initialActionState } from "@/lib/action-state";
import { closePoll, proposeCandidate, toggleApproval, toggleChosen, withdrawCandidate } from "../actions";

function Hidden({ pollId, candidateId }: { pollId: string; candidateId?: string }) {
  return (
    <>
      <input type="hidden" name="poll_id" value={pollId} />
      {candidateId && <input type="hidden" name="candidate_id" value={candidateId} />}
    </>
  );
}

/** A candidate's buttons, with one message for all of them. */
export function CandidateActions({
  pollId,
  candidateId,
  approve,
  choose,
  withdraw,
}: {
  pollId: string;
  candidateId: string;
  /** Whether the Member approves it now; absent when they cannot vote. */
  approve?: boolean;
  /** Whether it is chosen; absent unless the creator can choose. */
  choose?: boolean;
  withdraw: boolean;
}) {
  const [state, run] = useRowAction();
  return (
    <div className="space-y-2">
      <div className="actions">
        {approve !== undefined && (
          <form action={run(toggleApproval)}>
            <Hidden pollId={pollId} candidateId={candidateId} />
            <input type="hidden" name="approve" value={String(!approve)} />
            <SubmitButton className={approve ? "btn-primary" : "btn-secondary"} pendingText="…" aria-pressed={approve}>
              Me apetece
            </SubmitButton>
          </form>
        )}
        {choose !== undefined && (
          <form action={run(toggleChosen)}>
            <Hidden pollId={pollId} candidateId={candidateId} />
            <input type="hidden" name="chosen" value={String(!choose)} />
            <SubmitButton className={choose ? "btn-primary" : "btn-secondary"} pendingText="…">
              {choose ? "Elegido" : "Elegir"}
            </SubmitButton>
          </form>
        )}
        {withdraw && (
          <form action={run(withdrawCandidate)}>
            <Hidden pollId={pollId} candidateId={candidateId} />
            <ConfirmSubmitButton className="btn-secondary text-muted" confirmText="¿Quitar?">
              Quitar
            </ConfirmSubmitButton>
          </form>
        )}
      </div>
      <FormMessage state={state} />
    </div>
  );
}

export function ProposeForm({ pollId, games }: { pollId: string; games: { id: string; name: string }[] }) {
  const [state, action] = useActionState(proposeCandidate, initialActionState);
  return (
    <form action={action} className="space-y-2">
      <Hidden pollId={pollId} />
      <div className="flex gap-2">
        <select name="game_id" aria-label="Juego a proponer" className="input" defaultValue="">
          <option value="">Elige un juego del catálogo…</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <SubmitButton>Añadir</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}


export function ClosePollButton({ pollId }: { pollId: string }) {
  const [state, action] = useActionState(closePoll, initialActionState);
  return (
    <form action={action}>
      <Hidden pollId={pollId} />
      <ConfirmSubmitButton className="btn-secondary" confirmText="Sí, cerrar">
        Cerrar votación
      </ConfirmSubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
