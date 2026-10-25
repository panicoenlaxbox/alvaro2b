"use client";

import { useActionState } from "react";
import { ActionForm, FormMessage, RequiredMark, SubmitButton } from "@/components/form";
import { PlayerPicker } from "@/components/player-picker";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { bggPageUrl, GAME_NUMBER_LIMITS, GAME_TEXT_LIMITS, PLAY_MODE_LABELS, PLAY_MODES, type GameInput } from "@/lib/domain/game-form";

export type GameFormDefaults = Partial<GameInput> & { id?: string; owner_ids?: string[] };

function NumberField({ name, label, value, step }: { name: Exclude<keyof typeof GAME_NUMBER_LIMITS, "bgg_id">; label: string; value?: number | null; step?: string }) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input id={name} name={name} type="number" inputMode="decimal" step={step} {...GAME_NUMBER_LIMITS[name]} defaultValue={value ?? ""} className="input" />
    </div>
  );
}

export function GameForm({
  action,
  defaults = {},
  owners,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: GameFormDefaults;
  owners: { id: string; display_name: string; is_member: boolean; avatar_url: string | null; active: boolean }[];
}) {
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <ActionForm action={formAction} className="space-y-4">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      <div>
        <label htmlFor="name" className="label">
          Nombre
          <RequiredMark />
        </label>
        <input id="name" name="name" required maxLength={GAME_TEXT_LIMITS.name} defaultValue={defaults.name ?? ""} className="input" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField name="min_players" label="Mín. jugadores" value={defaults.min_players} />
        <NumberField name="max_players" label="Máx. jugadores" value={defaults.max_players} />
        <NumberField name="min_duration" label="Duración mín. (min)" value={defaults.min_duration} />
        <NumberField name="max_duration" label="Duración máx. (min)" value={defaults.max_duration} />
        <NumberField name="complexity" label="Complejidad (1–5)" value={defaults.complexity} step="0.1" />
        <NumberField name="year" label="Año" value={defaults.year} />
      </div>

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

      <fieldset>
        <legend className="label">Dueños</legend>
        <PlayerPicker name="owner_id" players={owners} selected={defaults.owner_ids ?? []} />
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="lower_score_wins" defaultChecked={defaults.lower_score_wins ?? false} className="size-4" />
        Gana la puntuación más baja
      </label>

      <div>
        <label htmlFor="bgg_id" className="label">
          Página en{" "}
          <a href="https://boardgamegeek.com" target="_blank" rel="noreferrer" className="link hover:text-accent">
            BoardGameGeek
          </a>
        </label>
        <input
          id="bgg_id"
          name="bgg_id"
          type="text"
          inputMode="url"
          placeholder="https://boardgamegeek.com/boardgame/…"
          defaultValue={defaults.bgg_id ? bggPageUrl(defaults.bgg_id) : ""}
          className="input"
        />
      </div>

      <div>
        <label htmlFor="notes" className="label">
          Notas
        </label>
        <textarea id="notes" name="notes" rows={3} maxLength={GAME_TEXT_LIMITS.notes} defaultValue={defaults.notes ?? ""} className="input" />
      </div>

      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full">Guardar</SubmitButton>
    </ActionForm>
  );
}
