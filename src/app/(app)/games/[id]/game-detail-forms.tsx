"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { ConfirmSubmitButton, FormMessage, SubmitButton, useRowAction } from "@/components/form";
import { useLeavingAction } from "@/components/leave";
import { Cover } from "@/components/cover";
import { CROSS, Icon, PENCIL } from "@/components/icon";
import { OwnerFaces } from "@/components/owners";
import { PlayerPicker } from "@/components/player-picker";
import type { Owner } from "@/lib/data/explore";
import type { PlayerOption } from "@/lib/data/players";
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
      {retired ? (
        <SubmitButton className="btn-secondary">Recuperar</SubmitButton>
      ) : (
        <ConfirmSubmitButton className="btn-secondary" confirmText="Sí, retirar">
          Retirar
        </ConfirmSubmitButton>
      )}
      <FormMessage state={state} />
    </form>
  );
}

export function DeleteGameButton({ gameId }: { gameId: string }) {
  const [state, action] = useLeavingAction(deleteGame);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={gameId} />
      <ConfirmSubmitButton confirmText="Sí, eliminar">Eliminar</ConfirmSubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

/** The Game's cover with a pencil to upload its own (camera or gallery on phones) and, with one, a cross to drop it. */
export function CoverEditor({ gameId, url, name, hasOwnCover, className }: { gameId: string; url: string | null; name: string; hasOwnCover: boolean; className: string }) {
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
    <div className="shrink-0 space-y-2">
      <div className={`relative ${pending ? "animate-pulse" : ""}`}>
        <Cover url={url} name={name} className={className} />
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
        <button
          type="button"
          disabled={pending}
          onClick={() => input.current?.click()}
          aria-label={hasOwnCover ? "Cambiar carátula" : "Añadir carátula"}
          title={hasOwnCover ? "Cambiar carátula" : "Añadir carátula"}
          className={`${COVER_BUTTON} -right-2 -bottom-2`}
        >
          <Icon d={PENCIL} className="size-4" />
        </button>
        {hasOwnCover && (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => void (await setCover(gameId, null)))}
            aria-label="Quitar carátula propia"
            title="Quitar carátula propia"
            className={`${COVER_BUTTON} -top-2 -right-2`}
          >
            <Icon d={CROSS} className="size-4" />
          </button>
        )}
      </div>
      {error && <p className="max-w-48 text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

const COVER_BUTTON = "absolute inline-flex size-9 items-center justify-center rounded-full border-[3px] border-ink bg-card text-foreground shadow-hard hover:bg-accent-soft disabled:opacity-50";

type ExpansionItem = { id: string; name: string; retired: boolean; owners: Owner[]; canDelete: boolean };

function ExpansionRow({ gameId, expansion }: { gameId: string; expansion: ExpansionItem }) {
  const [state, run] = useRowAction();
  return (
    <li className="space-y-1 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`flex-1 ${expansion.retired ? "text-muted line-through" : ""}`}>{expansion.name}</span>
        <OwnerFaces owners={expansion.owners} size={24} />
        <form action={run(setExpansionRetired)}>
          <input type="hidden" name="id" value={expansion.id} />
          <input type="hidden" name="game_id" value={gameId} />
          <input type="hidden" name="retired" value={String(!expansion.retired)} />
          {expansion.retired ? (
            <SubmitButton className="btn-secondary">Recuperar</SubmitButton>
          ) : (
            <ConfirmSubmitButton className="btn-secondary" confirmText="Sí, retirar">
              Retirar
            </ConfirmSubmitButton>
          )}
        </form>
        {expansion.canDelete && (
          <form action={run(deleteExpansion)}>
            <input type="hidden" name="id" value={expansion.id} />
            <input type="hidden" name="game_id" value={gameId} />
            <ConfirmSubmitButton confirmText="Sí, eliminar">
              Eliminar
            </ConfirmSubmitButton>
          </form>
        )}
      </div>
      <FormMessage state={state} />
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
  owners: PlayerOption[];
}) {
  const [state, action] = useActionState(addExpansion, initialActionState);
  return (
    <div className="space-y-3">
      {expansions.length > 0 && (
        <ul className="divide-y divide-border">
          {expansions.map((e) => (
            <ExpansionRow key={e.id} gameId={gameId} expansion={e} />
          ))}
        </ul>
      )}
      <form action={action} className="space-y-3">
        <input type="hidden" name="game_id" value={gameId} />
        <input name="name" required maxLength={120} placeholder="Nueva expansión" aria-label="Nombre de la expansión" className="input" />
        <fieldset className="space-y-2">
          <legend className="text-sm text-muted">De quién es</legend>
          <PlayerPicker name="owner_id" players={owners} />
        </fieldset>
        <SubmitButton>Añadir</SubmitButton>
        <FormMessage state={state} />
      </form>
    </div>
  );
}
