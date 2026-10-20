"use client";

import { useActionState } from "react";
import { ActionForm, FormMessage } from "@/components/form";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { PLAY_MODE_LABELS, PLAY_MODES, type GameInput } from "@/lib/domain/game-form";

export type GameFormDefaults = Partial<GameInput> & { id?: string; bgg_image_url?: string | null };

function NumberField({ name, label, value, step }: { name: string; label: string; value?: number | null; step?: string }) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input id={name} name={name} type="number" inputMode="decimal" step={step} defaultValue={value ?? ""} className="input" />
    </div>
  );
}

export function GameForm({
  action,
  defaults = {},
  owners,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: GameFormDefaults;
  owners: { id: string; display_name: string }[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <ActionForm action={formAction} className="space-y-4">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      {defaults.bgg_image_url && <input type="hidden" name="bgg_image_url" value={defaults.bgg_image_url} />}

      <div>
        <label htmlFor="name" className="label">
          Nombre *
        </label>
        <input id="name" name="name" required maxLength={120} defaultValue={defaults.name ?? ""} className="input" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField name="min_players" label="Mín. jugadores" value={defaults.min_players} />
        <NumberField name="max_players" label="Máx. jugadores" value={defaults.max_players} />
        <NumberField name="min_duration" label="Duración mín. (min)" value={defaults.min_duration} />
        <NumberField name="max_duration" label="Duración máx. (min)" value={defaults.max_duration} />
        <NumberField name="complexity" label="Complejidad (1–5)" value={defaults.complexity} step="0.1" />
        <NumberField name="year" label="Año" value={defaults.year} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="default_play_mode" className="label">
            Modo por defecto
          </label>
          <select id="default_play_mode" name="default_play_mode" defaultValue={defaults.default_play_mode ?? "competitive"} className="input">
            {PLAY_MODES.map((m) => (
              <option key={m} value={m}>
                {PLAY_MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="owner_id" className="label">
            Dueño
          </label>
          <select id="owner_id" name="owner_id" defaultValue={defaults.owner_id ?? ""} className="input">
            <option value="">Sin dueño (prestado, de un bar…)</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="lower_score_wins" defaultChecked={defaults.lower_score_wins ?? false} className="size-4" />
        Gana la puntuación más baja
      </label>

      <NumberField name="bgg_id" label="Id de BoardGameGeek (opcional)" value={defaults.bgg_id} />

      <div>
        <label htmlFor="notes" className="label">
          Notas
        </label>
        <textarea id="notes" name="notes" rows={3} maxLength={4000} defaultValue={defaults.notes ?? ""} className="input" />
      </div>

      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Guardando…" : submitLabel}
      </button>
    </ActionForm>
  );
}
