"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton, FormMessage, SubmitButton, useRowAction } from "@/components/form";
import { initialActionState } from "@/lib/action-state";
import { closePoll, proposeCandidate, setVeto, toggleApproval, toggleChosen, withdrawCandidate } from "../actions";

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
  veto,
  choose,
  withdraw,
}: {
  pollId: string;
  candidateId: string;
  /** Whether the Member approves it now; absent when they cannot vote. */
  approve?: boolean;
  /** Whether the Member vetoes it now; absent when vetoes are off or the poll is closed. */
  veto?: boolean;
  /** Whether it is chosen; absent unless the creator can choose. */
  choose?: boolean;
  withdraw: boolean;
}) {
  const [state, run] = useRowAction();
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {approve !== undefined && (
          <form action={run(toggleApproval)}>
            <Hidden pollId={pollId} candidateId={candidateId} />
            <input type="hidden" name="approve" value={String(!approve)} />
            <SubmitButton className={approve ? "btn-primary" : "btn-secondary"} pendingText="…" aria-pressed={approve}>
              {approve ? "👍 Me apetece" : "Me apetece"}
            </SubmitButton>
          </form>
        )}
        {veto !== undefined && (
          <form action={run(setVeto)}>
            <input type="hidden" name="poll_id" value={pollId} />
            <input type="hidden" name="candidate_id" value={veto ? "" : candidateId} />
            <SubmitButton className={veto ? "btn-danger bg-coral text-ink hover:bg-coral" : "btn-secondary"} pendingText="…" aria-pressed={veto}>
              {veto ? "🚫 Vetado" : "Vetar"}
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
        <SubmitButton>Proponer</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function SuggestButton({ pollId, gameId }: { pollId: string; gameId: string }) {
  const [state, action] = useActionState(proposeCandidate, initialActionState);
  return (
    <form action={action}>
      <Hidden pollId={pollId} />
      <input type="hidden" name="game_id" value={gameId} />
      <SubmitButton className="btn-secondary px-3 py-1 text-xs" pendingText="…">
        Proponer
      </SubmitButton>
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
