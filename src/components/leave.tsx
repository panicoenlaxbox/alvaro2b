"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { ConfirmSubmitButton, FormMessage } from "@/components/form";
import { initialActionState, type ActionState } from "@/lib/action-state";

/**
 * For actions that remove the page they run on (Eliminar): when the action returns `leaveTo`, replaces
 * the page with it. Not "back": create and edit redirect with replace, so the previous entry can be
 * the page just deleted. It leaves as soon as the action answers, before the refreshed (now missing)
 * page renders.
 */
type LeavingAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

export function useLeavingAction(action: LeavingAction) {
  const router = useRouter();
  return useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.leaveTo) router.replace(result.leaveTo);
    return result;
  }, initialActionState);
}

/** The Eliminar button of a detail page: it sends `id` to `action` and leaves the page when it is gone. */
export function DeleteButton({ action, id }: { action: LeavingAction; id: string }) {
  const [state, formAction] = useLeavingAction(action);
  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="id" value={id} />
      <ConfirmSubmitButton confirmText="Sí, eliminar">Eliminar</ConfirmSubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
