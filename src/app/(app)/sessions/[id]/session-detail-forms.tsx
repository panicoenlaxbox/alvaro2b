"use client";

import { useActionState } from "react";
import { ActionForm, FormMessage, SubmitButton } from "@/components/form";
import { DeleteButton } from "@/components/leave";
import { initialActionState } from "@/lib/action-state";
import { RSVP_LABELS, RSVP_RESPONSES, SESSION_TIME_PATTERN, type RsvpResponse } from "@/lib/domain/session";
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

/** The deadline goes in as a date and a time, like a Session's (see joinDeadline); both can stay empty. */
export function OpenPollForm({ sessionId, sessionDate, today }: { sessionId: string; sessionDate: string; today: string }) {
  const [state, action] = useActionState(openPoll, initialActionState);
  return (
    <ActionForm action={action} className="space-y-3">
      <input type="hidden" name="session_id" value={sessionId} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="closes_date" className="label">
            Fecha límite
          </label>
          <input id="closes_date" name="closes_date" type="date" min={today} max={sessionDate} className="input" />
        </div>
        <div>
          <label htmlFor="closes_time" className="label">
            Hora
          </label>
          <input
            id="closes_time"
            name="closes_time"
            inputMode="numeric"
            maxLength={5}
            pattern={SESSION_TIME_PATTERN}
            title="Formato 24 horas, como 20:30"
            placeholder="20:30"
            className="input"
          />
        </div>
      </div>
      <SubmitButton pendingText="Abriendo…">Abrir</SubmitButton>
      <FormMessage state={state} />
    </ActionForm>
  );
}
