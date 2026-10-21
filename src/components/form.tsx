"use client";

import { startTransition, useActionState, useEffect, useId, useState } from "react";

/**
 * A form for long inputs: unlike `<form action>`, React does not reset its fields after
 * submitting, so a validation error never wipes what the Member typed.
 */
export function ActionForm({
  action,
  children,
  ...rest
}: Omit<React.FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit"> & { action: (formData: FormData) => void }) {
  return (
    <form
      {...rest}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => action(formData));
      }}
    >
      {children}
    </form>
  );
}
import { useFormStatus } from "react-dom";
import { initialActionState, type ActionState } from "@/lib/action-state";

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

type RowAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * One message for a group of forms (a row's buttons): each form runs through `run(action)`, so the
 * group shows the result of its latest action only and a success clears an earlier error.
 */
export function useRowAction() {
  const [state, dispatch] = useActionState((prev: ActionState, [action, formData]: [RowAction, FormData]) => action(prev, formData), initialActionState);
  return [state, (action: RowAction) => (formData: FormData) => dispatch([action, formData])] as const;
}

/** Fired with the arming button's id so every other armed ConfirmSubmitButton collapses. */
const CONFIRM_ARMED_EVENT = "confirm-submit-armed";

/**
 * A submit button that asks for a second tap before submitting (no browser dialogs).
 * Only one is armed at a time on the page: arming one collapses the rest.
 */
export function ConfirmSubmitButton({
  children,
  confirmText = "¿Seguro? Pulsa otra vez",
  className = "btn-danger",
}: {
  children: React.ReactNode;
  confirmText?: string;
  className?: string;
}) {
  const id = useId();
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!armed) return;
    const onArmed = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) setArmed(false);
    };
    window.addEventListener(CONFIRM_ARMED_EVENT, onArmed);
    return () => window.removeEventListener(CONFIRM_ARMED_EVENT, onArmed);
  }, [armed, id]);

  if (!armed) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          window.dispatchEvent(new CustomEvent(CONFIRM_ARMED_EVENT, { detail: id }));
          setArmed(true);
        }}
      >
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
      <p role="alert" className="text-sm font-medium text-danger">
        {state.error}
      </p>
    );
  }
  if (state.message) return <p className="text-sm text-muted">{state.message}</p>;
  return null;
}

/** The "*" after a required field's label. Screen readers skip it; the field's `required` already says so. */
export function RequiredMark() {
  return (
    <span aria-hidden className="text-accent">
      {" *"}
    </span>
  );
}
