"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";

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

/** How long an armed ConfirmSubmitButton waits for the second tap. */
const CONFIRM_TIMEOUT_MS = 5000;

/**
 * A button that asks for a second tap before acting (no browser dialogs).
 * The first tap turns it into the confirmation in place: it keeps its size, so nothing around it
 * moves on a phone. Tapping anywhere else, Escape or a few seconds without a tap disarm it, and
 * arming one collapses the rest.
 */
export function ConfirmButton({
  children,
  onConfirm,
  confirmText = "¿Seguro? Pulsa otra vez",
  className = "btn-danger",
  pending = false,
  ...rest
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type"> & {
  onConfirm: (button: HTMLButtonElement) => void;
  confirmText?: string;
  pending?: boolean;
}) {
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    // While the action runs the label must stay put, so nothing disarms it.
    if (!armed || pending) return;
    const disarm = () => setArmed(false);
    const onArmed = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) disarm();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) disarm();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") disarm();
    };
    const timer = window.setTimeout(disarm, CONFIRM_TIMEOUT_MS);
    window.addEventListener(CONFIRM_ARMED_EVENT, onArmed);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(CONFIRM_ARMED_EVENT, onArmed);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [armed, pending, id]);

  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      disabled={pending}
      aria-live="polite"
      className={`${className} ${armed ? "!bg-danger !text-ink" : ""}`}
      onClick={(event) => {
        if (armed) return onConfirm(event.currentTarget);
        window.dispatchEvent(new CustomEvent(CONFIRM_ARMED_EVENT, { detail: id }));
        setArmed(true);
      }}
    >
      {/* Both labels share one grid cell, so the button is as wide as the longer one in either state. */}
      <span className="grid">
        <span className={`col-start-1 row-start-1 ${armed ? "invisible" : ""}`}>{children}</span>
        <span className={`col-start-1 row-start-1 ${armed ? "" : "invisible"}`} aria-hidden={!armed}>
          {pending ? "…" : confirmText}
        </span>
      </span>
    </button>
  );
}

/**
 * A ConfirmButton that submits its form on the second tap. It is never a submit button: React
 * would switch the type before the browser handles the first tap, and that tap would submit.
 */
export function ConfirmSubmitButton({
  children,
  confirmText,
  className,
}: {
  children: React.ReactNode;
  confirmText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <ConfirmButton confirmText={confirmText} className={className} pending={pending} onConfirm={(button) => button.form?.requestSubmit()}>
      {children}
    </ConfirmButton>
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
