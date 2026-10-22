"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { ActionForm, ConfirmSubmitButton, FormMessage, SubmitButton, useRowAction } from "@/components/form";
import { useLeavingAction } from "@/components/leave";
import { Cover } from "@/components/cover";
import { CROSS, EXTERNAL_LINK, Icon, PENCIL } from "@/components/icon";
import { OwnerFaces } from "@/components/owners";
import { PlayerPicker } from "@/components/player-picker";
import type { Owner } from "@/lib/data/explore";
import type { PlayerOption } from "@/lib/data/players";
import { initialActionState } from "@/lib/action-state";
import { bggPageUrl, GAME_TEXT_LIMITS } from "@/lib/domain/game-form";
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
  updateExpansion,
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
            className={`-mx-1 inline-flex size-11 items-center justify-center text-3xl leading-none ${n <= stars ? "text-accent" : "text-border"}`}
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

const COVER_BUTTON = "absolute inline-flex size-10 items-center justify-center rounded-full border-[3px] border-ink bg-card text-foreground shadow-hard hover:bg-accent-soft disabled:opacity-50";

type ExpansionItem = { id: string; name: string; bggId: number | null; retired: boolean; owners: Owner[] };

/** One form to add an Expansion or edit one (`expansion`): name, optional BGG page and owners. */
function ExpansionForm({
  gameId,
  expansion,
  members,
  onDone,
}: {
  gameId: string;
  expansion?: ExpansionItem;
  members: PlayerOption[];
  onDone: () => void;
}) {
  const [state, action] = useActionState(async (prev: typeof initialActionState, fd: FormData) => {
    const result = await (expansion ? updateExpansion : addExpansion)(prev, fd);
    if (result.ok) onDone();
    return result;
  }, initialActionState);
  return (
    <ActionForm action={action} className="space-y-3">
      {expansion && <input type="hidden" name="id" value={expansion.id} />}
      <input type="hidden" name="game_id" value={gameId} />
      <input
        name="name"
        defaultValue={expansion?.name}
        required
        maxLength={GAME_TEXT_LIMITS.name}
        placeholder="Nombre de la expansión"
        aria-label="Nombre de la expansión"
        className="input"
        autoFocus
      />
      <input
        name="bgg_id"
        defaultValue={expansion?.bggId ? bggPageUrl(expansion.bggId, "expansion") : ""}
        inputMode="url"
        placeholder="Página de BGG (opcional)"
        aria-label="Página de BGG de la expansión"
        className="input"
      />
      <fieldset className="space-y-2">
        <legend className="text-sm text-muted">De quién es</legend>
        <PlayerPicker name="owner_id" players={members} selected={expansion?.owners.map((o) => o.id)} />
      </fieldset>
      <div className="flex gap-2">
        <SubmitButton className="btn-primary flex-1 sm:flex-none">{expansion ? "Guardar" : "Añadir"}</SubmitButton>
        <button type="button" className="btn-secondary flex-1 sm:flex-none" onClick={onDone}>
          Cancelar
        </button>
      </div>
      <FormMessage state={state} />
    </ActionForm>
  );
}

function ExpansionRow({ gameId, expansion, members }: { gameId: string; expansion: ExpansionItem; members: PlayerOption[] }) {
  const [state, run] = useRowAction();
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <li className="py-2">
        <ExpansionForm gameId={gameId} expansion={expansion} members={members} onDone={() => setEditing(false)} />
      </li>
    );
  }
  return (
    <li className="space-y-2 py-2">
      <div className="flex items-center gap-2">
        <span className="flex min-w-0 flex-1 items-center">
          <span className={`min-w-0 break-words ${expansion.retired ? "text-muted line-through" : ""}`}>{expansion.name}</span>
          {expansion.bggId !== null && (
            <a
              href={bggPageUrl(expansion.bggId, "expansion")}
              target="_blank"
              rel="noreferrer"
              aria-label={`Ver ${expansion.name} en BoardGameGeek`}
              title="Ver en BoardGameGeek"
              className="-my-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-accent-soft hover:text-foreground"
            >
              <Icon d={EXTERNAL_LINK} className="size-4" />
            </a>
          )}
        </span>
        <OwnerFaces owners={expansion.owners} />
      </div>
      <div className="actions">
        <button type="button" className="btn-secondary" onClick={() => setEditing(true)}>
          Editar
        </button>
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
        <form action={run(deleteExpansion)}>
          <input type="hidden" name="id" value={expansion.id} />
          <input type="hidden" name="game_id" value={gameId} />
          <ConfirmSubmitButton confirmText="Sí, eliminar">
            Eliminar
          </ConfirmSubmitButton>
        </form>
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
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-3">
      {expansions.length > 0 && (
        <ul className="divide-y divide-border">
          {expansions.map((e) => (
            <ExpansionRow key={e.id} gameId={gameId} expansion={e} members={owners} />
          ))}
        </ul>
      )}
      {adding ? (
        <ExpansionForm gameId={gameId} members={owners} onDone={() => setAdding(false)} />
      ) : (
        <button type="button" className="btn-secondary" onClick={() => setAdding(true)}>
          Añadir expansión
        </button>
      )}
    </div>
  );
}
