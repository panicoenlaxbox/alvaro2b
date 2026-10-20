"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton, FormMessage, SubmitButton } from "@/components/form";
import { initialActionState } from "@/lib/action-state";
import { whatsappUrl } from "@/lib/share";
import { addAllowedEmail, removeAllowedEmail, setAdmin } from "./actions";

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
  playerName,
  signedUp,
  isSelf,
  appUrl,
}: {
  email: string;
  isAdmin: boolean;
  playerName: string | null;
  signedUp: boolean;
  isSelf: boolean;
  appUrl: string;
}) {
  const [adminState, adminAction] = useActionState(setAdmin, initialActionState);
  const [removeState, removeAction] = useActionState(removeAllowedEmail, initialActionState);

  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-medium">{playerName ?? email}</span>
        {isAdmin && <span className="chip border-accent text-accent">Admin</span>}
        <span className={`chip ${signedUp ? "" : "border-dashed text-muted"}`}>{signedUp ? "Ha entrado" : "Pendiente"}</span>
      </div>
      {playerName && <p className="truncate text-sm text-muted">{email}</p>}
      <div className="flex flex-wrap gap-2">
        {!signedUp && (
          <a className="btn-secondary" href={whatsappUrl(inviteText(appUrl, email))} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        )}
        <form action={adminAction}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="is_admin" value={String(!isAdmin)} />
          <SubmitButton className="btn-secondary">{isAdmin ? "Quitar Admin" : "Hacer Admin"}</SubmitButton>
        </form>
        {!isSelf && (
          <form action={removeAction}>
            <input type="hidden" name="email" value={email} />
            <ConfirmSubmitButton confirmText="Sí, quitar acceso">Quitar acceso</ConfirmSubmitButton>
          </form>
        )}
      </div>
      <FormMessage state={adminState} />
      <FormMessage state={removeState} />
    </li>
  );
}
