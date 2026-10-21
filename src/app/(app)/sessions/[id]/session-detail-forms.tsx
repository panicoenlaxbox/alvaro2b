"use client";

import { useActionState } from "react";
import { ActionForm, ConfirmSubmitButton, FormMessage, SubmitButton } from "@/components/form";
import { useLeavingAction } from "@/components/leave";
import { PlayerPicker } from "@/components/player-picker";
import { initialActionState } from "@/lib/action-state";
import { RSVP_LABELS, RSVP_RESPONSES, type RsvpResponse } from "@/lib/domain/session";
import { openPoll } from "../../polls/actions";
import { answerRsvp, deleteSession, setAttendees, setSessionStatus } from "../actions";

export function StatusButtons({ sessionId }: { sessionId: string }) {
  const [state, action] = useActionState(setSessionStatus, initialActionState);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={action}>
          <input type="hidden" name="id" value={sessionId} />
          <input type="hidden" name="status" value="held" />
          <SubmitButton>¡Empezamos!</SubmitButton>
        </form>
        <form action={action}>
          <input type="hidden" name="id" value={sessionId} />
          <input type="hidden" name="status" value="cancelled" />
          <ConfirmSubmitButton confirmText="Sí, cancelar">Cancelar sesión</ConfirmSubmitButton>
        </form>
      </div>
      <FormMessage state={state} />
    </div>
  );
}

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

export function AttendeesEditor({
  sessionId,
  players,
  selected,
}: {
  sessionId: string;
  players: { id: string; display_name: string; is_member: boolean }[];
  selected: string[];
}) {
  const [state, action, pending] = useActionState(setAttendees, initialActionState);
  return (
    <ActionForm action={action} className="space-y-3">
      <input type="hidden" name="id" value={sessionId} />
      <PlayerPicker key={selected.join(",")} name="attendee" players={players} selected={selected} />
      <button type="submit" disabled={pending} className="btn-secondary">
        {pending ? "Guardando…" : "Guardar asistentes"}
      </button>
      <FormMessage state={state} />
    </ActionForm>
  );
}

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const [state, action] = useLeavingAction(deleteSession);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={sessionId} />
      <ConfirmSubmitButton confirmText="Sí, eliminar">Eliminar</ConfirmSubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function OpenPollForm({ sessionId }: { sessionId: string }) {
  const [state, action, pending] = useActionState(openPoll, initialActionState);
  return (
    <ActionForm action={action} className="space-y-3">
      <input type="hidden" name="session_id" value={sessionId} />
      <div>
        <label htmlFor="closes_at" className="label">
          Fecha límite
        </label>
        <input id="closes_at" name="closes_at" type="datetime-local" className="input" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="allow_veto" className="size-4" /> Permitir un veto por persona
      </label>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Abriendo…" : "Abrir votación"}
      </button>
      <FormMessage state={state} />
    </ActionForm>
  );
}
