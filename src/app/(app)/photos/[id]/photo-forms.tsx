"use client";

import { useActionState } from "react";
import { ActionForm, ConfirmSubmitButton, FormMessage } from "@/components/form";
import { useLeavingAction } from "@/components/leave";
import { PlayerPicker } from "@/components/player-picker";
import { initialActionState } from "@/lib/action-state";
import { deletePhoto, updatePhoto } from "../actions";

export function PhotoEditor({
  photoId,
  caption,
  players,
  tagged,
  plays,
  playId,
}: {
  photoId: string;
  caption: string | null;
  players: { id: string; display_name: string; is_member: boolean }[];
  tagged: string[];
  plays: { id: string; name: string }[];
  playId: string | null;
}) {
  const [state, action, pending] = useActionState(updatePhoto, initialActionState);
  return (
    <ActionForm action={action} className="space-y-3">
      <input type="hidden" name="id" value={photoId} />
      <div>
        <label htmlFor="caption" className="label">
          Pie de foto
        </label>
        <input id="caption" name="caption" maxLength={500} defaultValue={caption ?? ""} className="input" />
      </div>
      <fieldset>
        <legend className="label">¿Quién sale?</legend>
        <PlayerPicker name="tag" players={players} selected={tagged} />
      </fieldset>
      {plays.length > 0 && (
        <div>
          <label htmlFor="play_id" className="label">
            Partida
          </label>
          <select id="play_id" name="play_id" defaultValue={playId ?? ""} className="input">
            <option value="">Ninguna</option>
            {plays.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Guardando…" : "Guardar"}
      </button>
      <FormMessage state={state} />
    </ActionForm>
  );
}

export function DeletePhotoButton({ photoId }: { photoId: string }) {
  const [state, action] = useLeavingAction(deletePhoto);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={photoId} />
      <ConfirmSubmitButton confirmText="Sí, eliminar">Eliminar</ConfirmSubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
