"use client";

import { useActionState, useState } from "react";
import { Avatar } from "@/components/avatar";
import { ConfirmSubmitButton, FormMessage, RequiredMark, SubmitButton, useRowAction } from "@/components/form";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { whatsappUrl } from "@/lib/share";
import { addAllowedEmail, addGuest, deleteGuest, deleteMember, removeAllowedEmail, renamePlayer, setAdmin, setGuestActive, setMemberActive } from "./actions";

/** WhatsApp's logo, from Simple Icons (CC0). */
function WhatsAppIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-[#25d366]">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function inviteText(appUrl: string, email: string) {
  return `¡Ya puedes entrar en alvaro2b! Abre ${appUrl} y entra con tu cuenta de Google ${email}.`;
}

/** The anchor of an allowlist row, so the "added" message can scroll to it. */
function rowId(email: string) {
  return `member-${email}`;
}

export function AddEmailForm({ guests }: { guests: { id: string; display_name: string }[] }) {
  const [state, action] = useActionState<ActionState & { email?: string }, FormData>(async (prev, formData) => {
    const result = await addAllowedEmail(prev, formData);
    return { ...result, email: String(formData.get("email") ?? "").trim().toLowerCase() };
  }, initialActionState);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="email" className="label">
          Email de su cuenta de Google
          <RequiredMark />
        </label>
        <input id="email" name="email" type="email" required className="input" autoComplete="off" />
      </div>
      {guests.length > 0 && (
        <div>
          <label htmlFor="guest_id" className="label">
            ¿Ya jugaba como invitado? (conserva su historial)
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
      {state.ok && state.email ? (
        <p className="text-sm">
          <a
            href={`#${rowId(state.email)}`}
            className="font-medium underline"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(rowId(state.email!))?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            Pásale un WhatsApp a {state.email}
          </a>
        </p>
      ) : (
        <FormMessage state={state} />
      )}
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
    <li id={rowId(email)} className={`space-y-2 px-4 py-3 ${deactivated ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {playerId && playerName ? (
          <>
            <Avatar name={playerName} url={avatarUrl} />
            <PlayerEditor id={playerId} name={playerName} />
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate font-medium">{email}</span>
        )}
        {isAdmin && <span className="chip border-accent text-accent">Admin</span>}
        <span className={`chip ${signedUp && !deactivated ? "" : "border-dashed text-muted"}`}>{status}</span>
      </div>
      {playerName && <p className="truncate text-sm text-muted">{email}</p>}
      <div className="flex flex-wrap gap-2">
        {!signedUp && (
          <a
            className="btn-secondary"
            href={whatsappUrl(inviteText(appUrl, email))}
            target="_blank"
            rel="noreferrer"
            aria-label="Enviar el enlace por WhatsApp"
            title="Enviar el enlace por WhatsApp"
          >
            <WhatsAppIcon />
          </a>
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
        <input name="display_name" required maxLength={60} placeholder="Nombre del invitado" className="input" aria-label="Nombre del invitado" />
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Avatar name={name} />
        <PlayerEditor id={id} name={name} />
        <span className={`chip ${deactivated ? "border-dashed text-muted" : ""}`}>{deactivated ? "Desactivado" : "Activo"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
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
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-accent-soft hover:text-foreground"
          aria-label={`Cambiar el nombre de ${name}`}
          onClick={() => setEditing(true)}
        >
          <PencilIcon />
        </button>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 basis-full space-y-2 sm:basis-auto">
      <div className="flex flex-wrap gap-2">
        <form action={renameAction} className="flex min-w-48 flex-1 gap-2">
          <input type="hidden" name="id" value={id} />
          <input name="display_name" defaultValue={name} required maxLength={60} className="input" aria-label="Nombre" autoFocus />
          <SubmitButton>Guardar</SubmitButton>
        </form>
        <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
          Cancelar
        </button>
      </div>
      <FormMessage state={renameState} />
    </div>
  );
}
