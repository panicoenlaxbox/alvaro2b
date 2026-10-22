"use server";

import { revalidatePath } from "next/cache";
import { RedirectType, redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { errorMessage, type ActionState } from "@/lib/action-state";
import { parseSessionTime, RSVP_RESPONSES, SESSION_TEXT_LIMITS, todayIso, type RsvpResponse } from "@/lib/domain/session";
import { createClient } from "@/lib/supabase/server";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

type SessionFields = { date: string; start_time: string | null; name: string | null; place: string | null; notes: string | null };

function sessionFields(formData: FormData): SessionFields | string {
  const date = String(formData.get("date") ?? "");
  if (!DATE.test(date) || Number.isNaN(Date.parse(date))) return "Elige una fecha.";
  const time = parseSessionTime(String(formData.get("start_time") ?? ""));
  if (time === "invalid") return "La hora va en formato 24 horas, como 20:30.";
  const name = String(formData.get("name") ?? "").trim();
  const place = String(formData.get("place") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (name.length > SESSION_TEXT_LIMITS.name) return "El nombre es demasiado largo.";
  if (place.length > SESSION_TEXT_LIMITS.place) return "El lugar es demasiado largo.";
  if (notes.length > SESSION_TEXT_LIMITS.notes) return "Las notas son demasiado largas.";
  return { date, start_time: time, name: name || null, place: place || null, notes: notes || null };
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

export async function createSession(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const fields = sessionFields(formData);
  if (typeof fields === "string") return { error: fields };

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("save_session", { session: { ...fields, attendee_ids: attendeeIds(formData) } });
  if (error) return { error: errorMessage(error) };

  revalidateSession(id);
  redirect(`/sessions/${id}`, RedirectType.replace);
}

export async function updateSession(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));
  const fields = sessionFields(formData);
  if (typeof fields === "string") return { error: fields };

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_session", { session: { id, ...fields, attendee_ids: attendeeIds(formData) } });
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
  if (!count) return { error: "No se ha encontrado; puede que ya se haya eliminado." };

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
