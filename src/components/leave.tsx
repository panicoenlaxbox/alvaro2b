"use client";

import { usePathname, useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { initialActionState, type ActionState } from "@/lib/action-state";

// Page changes since the app loaded: with none, "back" would leave the app (a link opened from WhatsApp).
let lastPathname: string | null = null;
let moves = 0;

/** Counts the page changes within the app; mounted once in the app layout. */
export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (lastPathname !== null && lastPathname !== pathname) moves++;
    lastPathname = pathname;
  }, [pathname]);
  return null;
}

/**
 * For actions that remove the page they run on (Eliminar): when the action returns `leaveTo`, goes
 * back to where the Member came from, or to `leaveTo` when there is no page to go back to. It leaves
 * as soon as the action answers, before the refreshed (now missing) page renders.
 */
export function useLeavingAction(action: (prev: ActionState, formData: FormData) => Promise<ActionState>) {
  const router = useRouter();
  return useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.leaveTo) {
      if (moves > 0) router.back();
      else router.replace(result.leaveTo);
    }
    return result;
  }, initialActionState);
}
