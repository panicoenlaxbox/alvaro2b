"use server";

import { revalidatePath } from "next/cache";
import { RedirectType, redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { errorMessage, NOT_FOUND, type ActionState } from "@/lib/action-state";
import { parseSessionForm, RSVP_RESPONSES, todayIso, type RsvpResponse, type SessionInput } from "@/lib/domain/session";
import { createClient } from "@/lib/supabase/server";

function formValues(formData: FormData): Partial<Record<keyof SessionInput, string | null>> {
  const values: Partial<Record<keyof SessionInput, string | null>> = {};
  for (const key of ["date", "start_time", "name", "place", "notes"] as const) {
    const v = formData.get(key);
    values[key] = typeof v === "string" ? v : null;
  }
  return values;
}

/** The Players ticked in the form; save_session makes them the Attendees, and those who stay keep their "maybe". */
function attendeeIds(formData: FormData): string[] {
  return [...new Set(formData.getAll("attendee").map(String))];
}

function revalidateSession(id: string) {
  revalidatePath("/sessions");
  revalidatePath(`/sessions/${id}`);
  revalidatePath("/");
}

/** Creates a Session (no "id" in the form) or edits it, with its Attendees, in one transaction; then opens it. */
export async function saveSession(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const formId = formData.get("id");
  const parsed = parseSessionForm(formValues(formData));
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("save_session", {
    session: { id: typeof formId === "string" ? formId : null, ...parsed.value, attendee_ids: attendeeIds(formData) },
  });
  if (error) return { error: errorMessage(error) };

  revalidateSession(id);
  redirect(`/sessions/${id}`, RedirectType.replace);
}

export async function deleteSession(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { error, count } = await supabase.from("sessions").delete({ count: "exact" }).eq("id", id);
  if (error) {
    return { error: error.code === "23503" ? "Tiene partidas o fotos. Elimínalas antes de eliminar la sesión." : errorMessage(error) };
  }
  if (!count) return { error: NOT_FOUND };

  revalidatePath("/sessions");
  revalidatePath("/");
  return { ok: true, leaveTo: "/sessions" };
}

export async function answerRsvp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const member = await requireMember();
  const id = String(formData.get("id"));
  const response = String(formData.get("response")) as RsvpResponse;
  if (!RSVP_RESPONSES.includes(response)) return { error: "Respuesta no válida." };

  // The answer is the Member's Attendee row: "Voy" and "Quizá" keep one, "No voy" removes it.
  const supabase = await createClient();
  const { error } = await supabase.rpc("answer_rsvp", { session: id, player: member.playerId, response });
  if (error) return { error: errorMessage(error) };

  revalidateSession(id);
  return { ok: true };
}

/**
 * "Empezar" after the dice: plays the Game today without asking. Uses today's Session (the latest
 * one if there are several) or creates it, adds the Member as an Attendee and opens the Play form
 * with the Game picked.
 */
export async function startToday(gameId: string): Promise<{ error: string }> {
  const member = await requireMember();
  const today = todayIso();

  const supabase = await createClient();
  const { data: sessionId, error } = await supabase.rpc("start_today", { today, player: member.playerId });
  if (error) return { error: errorMessage(error) };

  revalidateSession(sessionId);
  redirect(`/sessions/${sessionId}/plays/new?game=${encodeURIComponent(gameId)}`);
}
