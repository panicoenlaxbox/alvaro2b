"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton, FormMessage, RequiredMark, SubmitButton } from "@/components/form";
import { initialActionState } from "@/lib/action-state";
import { whatsappUrl } from "@/lib/share";
import { addAllowedEmail, deleteMember, removeAllowedEmail, setAdmin, setMemberActive } from "./actions";

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
        <input type="checkbox" name="is_admin" className="size-4" /> También es Admin
      </label>
      <SubmitButton>Autorizar</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function AllowedEmailRow({
  email,
  isAdmin,
  playerId,
  playerName,
  signedUp,
  deactivated,
  isSelf,
  appUrl,
}: {
  email: string;
  isAdmin: boolean;
  playerId: string | null;
  playerName: string | null;
  signedUp: boolean;
  deactivated: boolean;
  isSelf: boolean;
  appUrl: string;
}) {
  const [adminState, adminAction] = useActionState(setAdmin, initialActionState);
  const [removeState, removeAction] = useActionState(removeAllowedEmail, initialActionState);
  const [activeState, activeAction] = useActionState(setMemberActive, initialActionState);
  const [deleteState, deleteAction] = useActionState(deleteMember, initialActionState);
  const status = deactivated ? "Desactivado" : signedUp ? "Activo" : "Pendiente";

  return (
    <li className={`space-y-2 px-4 py-3 ${deactivated ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-medium">{playerName ?? email}</span>
        {isAdmin && <span className="chip border-accent text-accent">Admin</span>}
        <span className={`chip ${signedUp && !deactivated ? "" : "border-dashed text-muted"}`}>{status}</span>
      </div>
      {playerName && <p className="truncate text-sm text-muted">{email}</p>}
      <div className="flex flex-wrap gap-2">
        {!signedUp && (
          <a className="btn-secondary" href={whatsappUrl(inviteText(appUrl, email))} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        )}
        {!deactivated && (
          <form action={adminAction}>
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="is_admin" value={String(!isAdmin)} />
            <SubmitButton className="btn-secondary">{isAdmin ? "Quitar Admin" : "Hacer Admin"}</SubmitButton>
          </form>
        )}
        {!isSelf && !signedUp && (
          <form action={removeAction}>
            <input type="hidden" name="email" value={email} />
            <ConfirmSubmitButton confirmText="Sí, revocar">Revocar invitación</ConfirmSubmitButton>
          </form>
        )}
        {!isSelf && signedUp && playerId && !isAdmin && (
          <>
            <form action={activeAction}>
              <input type="hidden" name="player_id" value={playerId} />
              <input type="hidden" name="active" value={String(deactivated)} />
              {deactivated ? (
                <SubmitButton className="btn-secondary">Reactivar</SubmitButton>
              ) : (
                <ConfirmSubmitButton confirmText="Sí, desactivar">Desactivar</ConfirmSubmitButton>
              )}
            </form>
            <form action={deleteAction}>
              <input type="hidden" name="player_id" value={playerId} />
              <ConfirmSubmitButton confirmText="Sí, eliminar">Eliminar</ConfirmSubmitButton>
            </form>
          </>
        )}
      </div>
      {signedUp && !deactivated && !isSelf && !isAdmin && (
        <p className="text-xs hint">Desactivar conserva su historial. Eliminar solo es posible si no ha jugado ni creado nada.</p>
      )}
      <FormMessage state={adminState} />
      <FormMessage state={removeState} />
      <FormMessage state={activeState} />
      <FormMessage state={deleteState} />
    </li>
  );
}
