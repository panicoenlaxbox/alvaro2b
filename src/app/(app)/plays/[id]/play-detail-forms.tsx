"use client";

import { ConfirmSubmitButton, FormMessage } from "@/components/form";
import { useLeavingAction } from "@/components/leave";
import { deletePlay } from "../actions";

export function DeletePlayButton({ playId }: { playId: string }) {
  const [state, action] = useLeavingAction(deletePlay);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={playId} />
      <ConfirmSubmitButton confirmText="Sí, eliminar">Eliminar</ConfirmSubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
