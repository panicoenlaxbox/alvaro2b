"use client";

import { createContext, use, useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useDismiss } from "@/components/use-dismiss";
import { initialActionState, type ActionState } from "@/lib/action-state";

/** An ActionForm's pending flag: it submits by hand, so `useFormStatus` never sees it. */
const ActionFormPending = createContext(false);

/**
 * A form for long inputs: unlike `<form action>`, React does not reset its fields after
 * submitting, so a validation error never wipes what the Member typed.
 */
export function ActionForm({
  action,
  children,
  ...rest
}: Omit<React.FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit"> & { action: (formData: FormData) => void }) {
  // The action's transition is entangled with this one, so `pending` lasts until the action answers.
  const [pending, startTransition] = useTransition();
  return (
    <form
      {...rest}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => action(formData));
      }}
    >
      <ActionFormPending value={pending}>{children}</ActionFormPending>
    </form>
  );
}

export function SubmitButton({
  children,
  pendingText,
  className = "btn-primary",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const pending = useFormStatus().pending || use(ActionFormPending);
  return (
    <button type="submit" disabled={pending} className={className} {...rest}>
      {pending ? (pendingText ?? "Guardando…") : children}
    </button>
  );
}

type RowAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * For an ActionForm that adds something: `useActionState` plus a key that changes after each
 * success. Given to the form as its `key`, it empties the form then, while an error keeps what was typed.
 */
export function useAddAction(action: RowAction) {
  const [added, setAdded] = useState(0);
  const [state, dispatch, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.ok) setAdded((n) => n + 1);
    return result;
  }, initialActionState);
  return [state, dispatch, added, pending] as const;
}

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

  // While the action runs the label must stay put, so nothing disarms it.
  const listening = armed && !pending;
  useDismiss(ref, listening, () => setArmed(false));
  useEffect(() => {
    if (!listening) return;
    const disarm = () => setArmed(false);
    const onArmed = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) disarm();
    };
    const timer = window.setTimeout(disarm, CONFIRM_TIMEOUT_MS);
    window.addEventListener(CONFIRM_ARMED_EVENT, onArmed);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(CONFIRM_ARMED_EVENT, onArmed);
    };
  }, [listening, id]);

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
  const pending = useFormStatus().pending || use(ActionFormPending);
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
