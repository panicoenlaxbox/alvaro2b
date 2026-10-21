"use server";

import { revalidatePath } from "next/cache";
import { RedirectType, redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { errorMessage, type ActionState } from "@/lib/action-state";
import { parseSessionTime, RSVP_RESPONSES, SESSION_TEXT_LIMITS, type RsvpResponse } from "@/lib/domain/session";
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

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Makes the Attendees the Players ticked in the form; those who stay keep their "maybe". */
async function syncAttendees(supabase: Supabase, sessionId: string, formData: FormData): Promise<string | null> {
  const wanted = new Set(formData.getAll("attendee").map(String));
  const { data: current, error: readError } = await supabase.from("session_attendees").select("player_id").eq("session_id", sessionId);
  if (readError) return errorMessage(readError);
  const have = new Set((current ?? []).map((a) => a.player_id));

  const toAdd = [...wanted].filter((p) => !have.has(p));
  const toRemove = [...have].filter((p) => !wanted.has(p));
  if (toAdd.length) {
    const { error } = await supabase.from("session_attendees").insert(toAdd.map((player_id) => ({ session_id: sessionId, player_id })));
    if (error) return errorMessage(error);
  }
  if (toRemove.length) {
    const { error } = await supabase.from("session_attendees").delete().eq("session_id", sessionId).in("player_id", toRemove);
    if (error) return errorMessage(error);
  }
  return null;
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
  const { data, error } = await supabase.from("sessions").insert(fields).select("id").single();
  if (error) return { error: errorMessage(error) };
  const attendeeError = await syncAttendees(supabase, data.id, formData);
  if (attendeeError) return { error: attendeeError };

  revalidateSession(data.id);
  redirect(`/sessions/${data.id}`, RedirectType.replace);
}

export async function updateSession(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));
  const fields = sessionFields(formData);
  if (typeof fields === "string") return { error: fields };

  const supabase = await createClient();
  const { error } = await supabase.from("sessions").update(fields).eq("id", id).select("id").single();
  if (error) return { error: errorMessage(error) };
  const attendeeError = await syncAttendees(supabase, id, formData);
  if (attendeeError) return { error: attendeeError };

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
  const mine = supabase.from("session_attendees");
  if (response === "no") {
    const { error } = await mine.delete().eq("session_id", id).eq("player_id", member.playerId);
    if (error) return { error: errorMessage(error) };
  } else {
    const maybe = response === "maybe";
    const { data: updated, error } = await mine.update({ maybe }).eq("session_id", id).eq("player_id", member.playerId).select("player_id");
    if (error) return { error: errorMessage(error) };
    if (!updated.length) {
      const { error: insertError } = await supabase.from("session_attendees").insert({ session_id: id, player_id: member.playerId, maybe });
      if (insertError) return { error: errorMessage(insertError) };
    }
  }

  revalidateSession(id);
  return { ok: true };
}
