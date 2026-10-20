"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/action-state";

export function SubmitButton({
  children,
  pendingText,
  className = "btn-primary",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} {...rest}>
      {pending ? (pendingText ?? "Guardando…") : children}
    </button>
  );
}

/** A submit button that asks for a second tap before submitting (no browser dialogs). */
export function ConfirmSubmitButton({
  children,
  confirmText = "¿Seguro? Pulsa otra vez",
  className = "btn-danger",
}: {
  children: React.ReactNode;
  confirmText?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();

  if (!armed) {
    return (
      <button type="button" className={className} onClick={() => setArmed(true)}>
        {children}
      </button>
    );
  }
  return (
    <span className="inline-flex gap-2">
      <button type="submit" disabled={pending} className={className}>
        {pending ? "…" : confirmText}
      </button>
      <button type="button" className="btn-secondary" onClick={() => setArmed(false)}>
        Cancelar
      </button>
    </span>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-red-700 dark:text-red-400">
        {state.error}
      </p>
    );
  }
  if (state.message) return <p className="text-sm text-muted">{state.message}</p>;
  return null;
}
