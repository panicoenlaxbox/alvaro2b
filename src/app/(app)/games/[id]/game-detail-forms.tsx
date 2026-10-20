"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { ConfirmSubmitButton, FormMessage, SubmitButton } from "@/components/form";
import { initialActionState } from "@/lib/action-state";
import { COVER_MAX_SIDE } from "@/lib/domain/image-size";
import { compressImage } from "@/lib/image-client";
import { createClient } from "@/lib/supabase/client";
import {
  addExpansion,
  deleteExpansion,
  deleteGame,
  rateGame,
  setCover,
  setExpansionRetired,
  setGameRetired,
} from "../actions";

export function RatingPicker({ gameId, stars }: { gameId: string; stars: number }) {
  const [state, action] = useActionState(rateGame, initialActionState);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="game_id" value={gameId} />
      <div className="flex items-center gap-1" role="group" aria-label="Valoración">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="submit"
            name="stars"
            value={n === stars ? 0 : n}
            aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
            aria-pressed={n <= stars}
            className={`text-3xl leading-none ${n <= stars ? "text-accent" : "text-border"}`}
          >
            ★
          </button>
        ))}
        {stars > 0 && <span className="ml-2 text-xs text-muted">Pulsa tu estrella para quitarla</span>}
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function RetireGameButton({ gameId, retired }: { gameId: string; retired: boolean }) {
  const [state, action] = useActionState(setGameRetired, initialActionState);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={gameId} />
      <input type="hidden" name="retired" value={String(!retired)} />
      <SubmitButton className="btn-secondary">{retired ? "Recuperar" : "Retirar (ya no lo tenemos)"}</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function DeleteGameButton({ gameId }: { gameId: string }) {
  const [state, action] = useActionState(deleteGame, initialActionState);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={gameId} />
      <ConfirmSubmitButton confirmText="Sí, borrar">Borrar</ConfirmSubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function CoverUploader({ gameId, hasOwnCover }: { gameId: string; hasOwnCover: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function upload(file: File) {
    setError(null);
    startTransition(async () => {
      try {
        const image = await compressImage(file, COVER_MAX_SIDE, 300 * 1024);
        const path = `covers/${gameId}/${crypto.randomUUID()}.${image.extension}`;
        const { error: uploadError } = await createClient().storage.from("media").upload(path, image.blob, { contentType: image.type });
        if (uploadError) throw uploadError;
        const result = await setCover(gameId, path);
        if (result.error) setError(result.error);
      } catch {
        setError("No se ha podido subir la imagen.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">Sube una foto propia; sustituye a la imagen de BoardGameGeek.</p>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" disabled={pending} onClick={() => input.current?.click()}>
          {pending ? "Subiendo…" : hasOwnCover ? "Cambiar carátula" : "Subir carátula"}
        </button>
        {hasOwnCover && (
          <button
            type="button"
            className="btn-secondary"
            disabled={pending}
            onClick={() => startTransition(async () => void (await setCover(gameId, null)))}
          >
            Quitar carátula propia
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-700 dark:text-red-400">{error}</p>}
    </div>
  );
}

type ExpansionItem = { id: string; name: string; retired: boolean; ownerName: string | null; canDelete: boolean };

function ExpansionRow({ gameId, expansion }: { gameId: string; expansion: ExpansionItem }) {
  const [retireState, retireAction] = useActionState(setExpansionRetired, initialActionState);
  const [deleteState, deleteAction] = useActionState(deleteExpansion, initialActionState);
  return (
    <li className="space-y-1 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`flex-1 ${expansion.retired ? "text-muted line-through" : ""}`}>
          {expansion.name}
          {expansion.ownerName && <span className="text-sm text-muted"> · de {expansion.ownerName}</span>}
        </span>
        <form action={retireAction}>
          <input type="hidden" name="id" value={expansion.id} />
          <input type="hidden" name="game_id" value={gameId} />
          <input type="hidden" name="retired" value={String(!expansion.retired)} />
          <SubmitButton className="text-sm text-muted underline">{expansion.retired ? "Recuperar" : "Retirar"}</SubmitButton>
        </form>
        {expansion.canDelete && (
          <form action={deleteAction}>
            <input type="hidden" name="id" value={expansion.id} />
            <input type="hidden" name="game_id" value={gameId} />
            <ConfirmSubmitButton className="text-sm text-red-700 underline dark:text-red-400" confirmText="¿Borrar?">
              Borrar
            </ConfirmSubmitButton>
          </form>
        )}
      </div>
      <FormMessage state={retireState} />
      <FormMessage state={deleteState} />
    </li>
  );
}

export function ExpansionList({
  gameId,
  expansions,
  owners,
}: {
  gameId: string;
  expansions: ExpansionItem[];
  owners: { id: string; display_name: string }[];
}) {
  const [state, action] = useActionState(addExpansion, initialActionState);
  return (
    <div className="space-y-3">
      {expansions.length > 0 ? (
        <ul className="divide-y divide-border">
          {expansions.map((e) => (
            <ExpansionRow key={e.id} gameId={gameId} expansion={e} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Sin expansiones.</p>
      )}
      <form action={action} className="space-y-2">
        <input type="hidden" name="game_id" value={gameId} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input name="name" required maxLength={120} placeholder="Nueva expansión" aria-label="Nombre de la expansión" className="input" />
          <select name="owner_id" aria-label="Dueño de la expansión" className="input sm:w-48" defaultValue="">
            <option value="">Sin dueño</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.display_name}
              </option>
            ))}
          </select>
          <SubmitButton>Añadir</SubmitButton>
        </div>
        <FormMessage state={state} />
      </form>
    </div>
  );
}
