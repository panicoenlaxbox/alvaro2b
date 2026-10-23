"use client";

import { useActionState } from "react";
import { ActionForm, FormMessage, SubmitButton } from "@/components/form";
import { DeleteButton } from "@/components/leave";
import { initialActionState } from "@/lib/action-state";
import { RSVP_LABELS, RSVP_RESPONSES, type RsvpResponse } from "@/lib/domain/session";
import { openPoll } from "../../polls/actions";
import { answerRsvp, deleteSession } from "../actions";

export function RsvpButtons({ sessionId, current }: { sessionId: string; current: RsvpResponse | null }) {
  const [state, action] = useActionState(answerRsvp, initialActionState);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={sessionId} />
      <div className="flex gap-2" role="group" aria-label="Tu respuesta">
        {RSVP_RESPONSES.map((r) => (
          <button
            key={r}
            type="submit"
            name="response"
            value={r}
            aria-pressed={current === r}
            className={current === r ? "btn-primary flex-1" : "btn-secondary flex-1"}
          >
            {RSVP_LABELS[r]}
          </button>
        ))}
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  return <DeleteButton action={deleteSession} id={sessionId} />;
}

/** `latest`: the latest deadline allowed, the Session's start (see latestDeadline). */
export function OpenPollForm({ sessionId, latest }: { sessionId: string; latest: string }) {
  const [state, action] = useActionState(openPoll, initialActionState);
  return (
    <ActionForm action={action} className="space-y-3">
      <input type="hidden" name="session_id" value={sessionId} />
      <div>
        <label htmlFor="closes_at" className="label">
          Fecha límite
        </label>
        <input id="closes_at" name="closes_at" type="datetime-local" max={latest} className="input" />
      </div>
      <SubmitButton pendingText="Abriendo…">Abrir votación</SubmitButton>
      <FormMessage state={state} />
    </ActionForm>
  );
}
