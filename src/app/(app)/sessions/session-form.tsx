"use client";

import { useActionState } from "react";
import { ActionForm, FormMessage, RequiredMark } from "@/components/form";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { PlayerPicker } from "@/components/player-picker";

export function SessionForm({
  action,
  defaults,
  players,
  today,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: { id: string; date: string; name: string | null; place: string | null; notes: string | null };
  players?: { id: string; display_name: string; is_member: boolean }[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <ActionForm action={formAction} className="space-y-4">
      {defaults && <input type="hidden" name="id" value={defaults.id} />}
      <div>
        <label htmlFor="date" className="label">
          Fecha
          <RequiredMark />
        </label>
        <input id="date" name="date" type="date" required defaultValue={defaults?.date ?? today} className="input" />
      </div>
      <div>
        <label htmlFor="name" className="label">
          Nombre
        </label>
        <input id="name" name="name" maxLength={60} defaultValue={defaults?.name ?? ""} className="input" />
      </div>
      <div>
        <label htmlFor="place" className="label">
          Lugar
        </label>
        <input id="place" name="place" maxLength={120} defaultValue={defaults?.place ?? ""} className="input" />
      </div>
      {players && (
        <fieldset>
          <legend className="label">Asistentes</legend>
          <PlayerPicker name="attendee" players={players} />
        </fieldset>
      )}
      <div>
        <label htmlFor="notes" className="label">
          Notas
        </label>
        <textarea id="notes" name="notes" rows={3} maxLength={4000} defaultValue={defaults?.notes ?? ""} className="input" />
      </div>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </ActionForm>
  );
}
