"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton, FormMessage, SubmitButton } from "@/components/form";
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

export function ApprovalButton({ pollId, candidateId, approved }: { pollId: string; candidateId: string; approved: boolean }) {
  const [state, action] = useActionState(toggleApproval, initialActionState);
  return (
    <form action={action}>
      <Hidden pollId={pollId} candidateId={candidateId} />
      <input type="hidden" name="approve" value={String(!approved)} />
      <SubmitButton className={approved ? "btn-primary" : "btn-secondary"} pendingText="…" aria-pressed={approved}>
        {approved ? "👍 Me apetece" : "Me apetece"}
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function VetoButton({ pollId, candidateId, vetoed }: { pollId: string; candidateId: string; vetoed: boolean }) {
  const [state, action] = useActionState(setVeto, initialActionState);
  return (
    <form action={action}>
      <input type="hidden" name="poll_id" value={pollId} />
      <input type="hidden" name="candidate_id" value={vetoed ? "" : candidateId} />
      <SubmitButton className={vetoed ? "btn-danger border-red-500" : "btn-secondary"} pendingText="…" aria-pressed={vetoed}>
        {vetoed ? "🚫 Vetado" : "Vetar"}
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function ChosenButton({ pollId, candidateId, chosen }: { pollId: string; candidateId: string; chosen: boolean }) {
  const [state, action] = useActionState(toggleChosen, initialActionState);
  return (
    <form action={action}>
      <Hidden pollId={pollId} candidateId={candidateId} />
      <input type="hidden" name="chosen" value={String(!chosen)} />
      <SubmitButton className={chosen ? "btn-primary" : "btn-secondary"} pendingText="…">
        {chosen ? "Elegido" : "Elegir"}
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function WithdrawButton({ pollId, candidateId }: { pollId: string; candidateId: string }) {
  const [state, action] = useActionState(withdrawCandidate, initialActionState);
  return (
    <form action={action}>
      <Hidden pollId={pollId} candidateId={candidateId} />
      <ConfirmSubmitButton className="btn-secondary text-muted" confirmText="¿Quitar?">
        Quitar
      </ConfirmSubmitButton>
      <FormMessage state={state} />
    </form>
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
