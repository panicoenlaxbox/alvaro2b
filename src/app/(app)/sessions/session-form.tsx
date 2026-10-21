"use client";

import { useActionState } from "react";
import { ActionForm, FormMessage, RequiredMark } from "@/components/form";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { PlayerPicker } from "@/components/player-picker";
import { formatSessionTime, SESSION_TEXT_LIMITS, SESSION_TIME_PATTERN } from "@/lib/domain/session";

export function SessionForm({
  action,
  defaults,
  players,
  today,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: { id: string; date: string; start_time: string | null; name: string | null; place: string | null; notes: string | null; attendeeIds: string[]; maybeIds: string[] };
  players: { id: string; display_name: string; is_member: boolean }[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <ActionForm action={formAction} className="space-y-4">
      {defaults && <input type="hidden" name="id" value={defaults.id} />}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="date" className="label">
            Fecha
            <RequiredMark />
          </label>
          <input id="date" name="date" type="date" required defaultValue={defaults?.date ?? today} className="input" />
        </div>
        <div>
          <label htmlFor="start_time" className="label">
            Hora
          </label>
          <input
            id="start_time"
            name="start_time"
            inputMode="numeric"
            maxLength={5}
            pattern={SESSION_TIME_PATTERN}
            title="Formato 24 horas, como 20:30"
            placeholder="20:30"
            defaultValue={formatSessionTime(defaults?.start_time ?? null) ?? ""}
            className="input"
          />
        </div>
      </div>
      <div>
        <label htmlFor="name" className="label">
          Nombre
        </label>
        <input id="name" name="name" maxLength={SESSION_TEXT_LIMITS.name} defaultValue={defaults?.name ?? ""} className="input" />
      </div>
      <div>
        <label htmlFor="place" className="label">
          Lugar
        </label>
        <input id="place" name="place" maxLength={SESSION_TEXT_LIMITS.place} defaultValue={defaults?.place ?? ""} className="input" />
      </div>
      <fieldset>
        <legend className="label">Asistentes</legend>
        <PlayerPicker name="attendee" players={players} selected={defaults?.attendeeIds} maybe={defaults?.maybeIds} />
      </fieldset>
      <div>
        <label htmlFor="notes" className="label">
          Notas
        </label>
        <textarea id="notes" name="notes" rows={3} maxLength={SESSION_TEXT_LIMITS.notes} defaultValue={defaults?.notes ?? ""} className="input" />
      </div>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </ActionForm>
  );
}
