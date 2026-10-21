"use client";

import { useActionState, useState } from "react";
import { Avatar } from "@/components/avatar";
import { ConfirmSubmitButton, FormMessage, SubmitButton, useRowAction } from "@/components/form";
import { initialActionState } from "@/lib/action-state";
import { PLAYER_NAME_MAX } from "@/lib/domain/players";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { addAllowedEmail, addGuest, deleteGuest, deleteMember, removeAllowedEmail, renamePlayer, setAdmin, setGuestActive, setMemberActive } from "./actions";

/** Soft red needs action, green is live, dashed is off. */
const STATUS_CHIP = {
  Pendiente: "border-danger text-danger",
  Activo: "border-green text-green",
  Desactivado: "border-dashed text-muted",
} as const;

function inviteText(appUrl: string, email: string) {
  return `¡Ya puedes entrar en alvaro2b! Abre ${appUrl} y entra con tu cuenta de Google ${email}.`;
}

export function AddEmailForm({ guests }: { guests: { id: string; display_name: string }[] }) {
  const [state, action] = useActionState(addAllowedEmail, initialActionState);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="email" className="label">
          Email de su cuenta de Google
        </label>
        <input id="email" name="email" type="email" required className="input" autoComplete="off" />
      </div>
      {guests.length > 0 && (
        <div>
          <label htmlFor="guest_id" className="label">
            ¿Ya jugaba como invitado? <span className="text-[0.6875rem]">(conserva su historial)</span>
          </label>
          <select id="guest_id" name="guest_id" className="input" defaultValue="">
            <option value="">No, es alguien nuevo</option>
            {guests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.display_name}
              </option>
            ))}
          </select>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_admin" className="size-4" /> Hacer Admin
      </label>
      <SubmitButton>Añadir</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function AllowedEmailRow({
  email,
  isAdmin,
  playerId,
  playerName,
  avatarUrl,
  signedUp,
  deactivated,
  isSelf,
  appUrl,
}: {
  email: string;
  isAdmin: boolean;
  playerId: string | null;
  playerName: string | null;
  avatarUrl: string | null;
  signedUp: boolean;
  deactivated: boolean;
  isSelf: boolean;
  appUrl: string;
}) {
  const [state, run] = useRowAction();
  const status = deactivated ? "Desactivado" : signedUp ? "Activo" : "Pendiente";

  return (
    <li className={`space-y-2 px-4 py-3 ${deactivated ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        {playerId && playerName ? (
          <>
            <FaceSlot>
              <Avatar name={playerName} url={avatarUrl} />
            </FaceSlot>
            <PlayerEditor id={playerId} name={playerName} />
          </>
        ) : (
          <span className="min-w-0 flex-1 self-center truncate font-medium">{email}</span>
        )}
        {isAdmin && <span className="chip self-center border-accent text-accent">Admin</span>}
        <span className={`chip self-center ${STATUS_CHIP[status]}`}>{status}</span>
      </div>
      {playerName && <p className="truncate text-sm text-muted">{email}</p>}
      <div className="actions">
        {!signedUp && (
          <WhatsAppButton text={inviteText(appUrl, email)} label="Enviar el enlace por WhatsApp" className="flex-none" />
        )}
        {!deactivated && (
          <form action={run(setAdmin)}>
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="is_admin" value={String(!isAdmin)} />
            <SubmitButton className="btn-secondary">{isAdmin ? "Quitar Admin" : "Hacer Admin"}</SubmitButton>
          </form>
        )}
        {!isSelf && !signedUp && (
          <form action={run(removeAllowedEmail)}>
            <input type="hidden" name="email" value={email} />
            <ConfirmSubmitButton confirmText="Sí, revocar">Revocar invitación</ConfirmSubmitButton>
          </form>
        )}
        {!isSelf && signedUp && playerId && !isAdmin && (
          <>
            <form action={run(setMemberActive)}>
              <input type="hidden" name="player_id" value={playerId} />
              <input type="hidden" name="active" value={String(deactivated)} />
              {deactivated ? (
                <SubmitButton className="btn-secondary">Reactivar</SubmitButton>
              ) : (
                <ConfirmSubmitButton confirmText="Sí, desactivar">Desactivar</ConfirmSubmitButton>
              )}
            </form>
            <form action={run(deleteMember)}>
              <input type="hidden" name="player_id" value={playerId} />
              <ConfirmSubmitButton confirmText="Sí, eliminar">Eliminar</ConfirmSubmitButton>
            </form>
          </>
        )}
      </div>
      <FormMessage state={state} />
    </li>
  );
}

export function AddGuestForm() {
  const [state, action] = useActionState(addGuest, initialActionState);
  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <input name="display_name" required maxLength={PLAYER_NAME_MAX} placeholder="Nombre del invitado" className="input" aria-label="Nombre del invitado" />
        <SubmitButton>Añadir</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function GuestRow({ id, name, deactivated }: { id: string; name: string; deactivated: boolean }) {
  const [state, run] = useRowAction();
  return (
    <li className={`space-y-2 px-4 py-3 ${deactivated ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <FaceSlot>
          <Avatar name={name} />
        </FaceSlot>
        <PlayerEditor id={id} name={name} />
        <span className={`chip self-center ${STATUS_CHIP[deactivated ? "Desactivado" : "Activo"]}`}>{deactivated ? "Desactivado" : "Activo"}</span>
      </div>
      <div className="actions">
        <form action={run(setGuestActive)}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="active" value={String(deactivated)} />
          {deactivated ? (
            <SubmitButton className="btn-secondary">Reactivar</SubmitButton>
          ) : (
            <ConfirmSubmitButton confirmText="Sí, desactivar">Desactivar</ConfirmSubmitButton>
          )}
        </form>
        <form action={run(deleteGuest)}>
          <input type="hidden" name="id" value={id} />
          <ConfirmSubmitButton confirmText="Sí, eliminar">Eliminar</ConfirmSubmitButton>
        </form>
      </div>
      <FormMessage state={state} />
    </li>
  );
}

/** The face beside a name, centred on the name's line (as tall as the name input) even while editing. */
function FaceSlot({ children }: { children: React.ReactNode }) {
  return <span className="flex h-[3.125rem] shrink-0 items-center">{children}</span>;
}

function PencilIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function PlayerEditor({ id, name }: { id: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [renameState, renameAction] = useActionState(async (prev: typeof initialActionState, fd: FormData) => {
    const result = await renamePlayer(prev, fd);
    if (result.ok) setEditing(false);
    return result;
  }, initialActionState);
  if (!editing) {
    return (
      // As tall as the name input, so the row keeps its height when editing starts.
      <div className="flex min-h-[3.125rem] min-w-0 flex-1 items-center gap-1">
        <span className="truncate font-medium">{name}</span>
        <button
          type="button"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-accent-soft hover:text-foreground"
          aria-label={`Cambiar el nombre de ${name}`}
          onClick={() => setEditing(true)}
        >
          <PencilIcon />
        </button>
      </div>
    );
  }

  return (
    // The rest of the row beside the face; the chips wrap under it.
    <form action={renameAction} className="min-w-0 flex-1 basis-[calc(100%-3rem)] space-y-2">
      <input type="hidden" name="id" value={id} />
      <input name="display_name" defaultValue={name} required maxLength={PLAYER_NAME_MAX} className="input" aria-label="Nombre" autoFocus />
      <div className="flex gap-2">
        <SubmitButton className="btn-primary flex-1 sm:flex-none">Guardar</SubmitButton>
        <button type="button" className="btn-secondary flex-1 sm:flex-none" onClick={() => setEditing(false)}>
          Cancelar
        </button>
      </div>
      <FormMessage state={renameState} />
    </form>
  );
}
