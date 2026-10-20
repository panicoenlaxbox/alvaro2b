"use client";

import { useActionState, useState } from "react";
import { ConfirmSubmitButton, FormMessage, SubmitButton } from "@/components/form";
import { initialActionState } from "@/lib/action-state";
import { addGuest, deleteGuest, renamePlayer } from "./actions";

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

export function PlayerEditor({ id, name, canDelete = false }: { id: string; name: string; canDelete?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [renameState, renameAction] = useActionState(async (prev: typeof initialActionState, fd: FormData) => {
    const result = await renamePlayer(prev, fd);
    if (result.ok) setEditing(false);
    return result;
  }, initialActionState);
  const [deleteState, deleteAction] = useActionState(deleteGuest, initialActionState);

  if (!editing) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="truncate font-medium">{name}</span>
        <button type="button" className="text-sm text-muted underline" onClick={() => setEditing(true)}>
          Editar
        </button>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 space-y-2">
      <form action={renameAction} className="flex gap-2">
        <input type="hidden" name="id" value={id} />
        <input name="display_name" defaultValue={name} required maxLength={60} className="input" aria-label="Nombre" />
        <SubmitButton>Guardar</SubmitButton>
      </form>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
          Cancelar
        </button>
        {canDelete && (
          <form action={deleteAction}>
            <input type="hidden" name="id" value={id} />
            <ConfirmSubmitButton>Borrar invitado</ConfirmSubmitButton>
          </form>
        )}
      </div>
      <FormMessage state={renameState} />
      <FormMessage state={deleteState} />
    </div>
  );
}
