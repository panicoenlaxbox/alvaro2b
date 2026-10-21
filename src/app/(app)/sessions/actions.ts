"use server";

import { revalidatePath } from "next/cache";
import { RedirectType, redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { errorMessage, type ActionState } from "@/lib/action-state";
import { RSVP_RESPONSES, type RsvpResponse } from "@/lib/domain/session";
import { createClient } from "@/lib/supabase/server";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function sessionFields(formData: FormData): { date: string; name: string | null; place: string | null; notes: string | null } | string {
  const date = String(formData.get("date") ?? "");
  if (!DATE.test(date) || Number.isNaN(Date.parse(date))) return "Elige una fecha.";
  const name = String(formData.get("name") ?? "").trim();
  const place = String(formData.get("place") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (name.length > 60) return "El nombre es demasiado largo.";
  if (place.length > 120) return "El lugar es demasiado largo.";
  if (notes.length > 4000) return "Las notas son demasiado largas.";
  return { date, name: name || null, place: place || null, notes: notes || null };
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
  const attendees = formData.getAll("attendee").map(String);

  const supabase = await createClient();
  const { data, error } = await supabase.from("sessions").insert(fields).select("id").single();
  if (error) return { error: errorMessage(error) };

  if (attendees.length) {
    const { error: attendeeError } = await supabase
      .from("session_attendees")
      .insert(attendees.map((player_id) => ({ session_id: data.id, player_id })));
    if (attendeeError) return { error: errorMessage(attendeeError) };
  }

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

  revalidateSession(id);
  redirect(`/sessions/${id}`, RedirectType.replace);
}

export async function setSessionStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));
  const status = formData.get("status") === "cancelled" ? "cancelled" : "held";

  const supabase = await createClient();
  const { error } = await supabase.from("sessions").update({ status }).eq("id", id).select("id").single();
  if (error) return { error: errorMessage(error) };

  revalidateSession(id);
  return { ok: true };
}

export async function deleteSession(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { error, count } = await supabase.from("sessions").delete({ count: "exact" }).eq("id", id);
  if (error) {
    return { error: error.code === "23503" ? "Tiene partidas o fotos. Elimínalas antes de eliminar la sesión." : errorMessage(error) };
  }
  if (!count) return { error: "Solo quien la creó o el Admin pueden eliminarla." };

  revalidatePath("/sessions");
  revalidatePath("/");
  return { ok: true, leaveTo: "/sessions" };
}

export async function setAttendees(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));
  const wanted = new Set(formData.getAll("attendee").map(String));

  const supabase = await createClient();
  const { data: current, error: readError } = await supabase.from("session_attendees").select("player_id").eq("session_id", id);
  if (readError) return { error: errorMessage(readError) };
  const have = new Set((current ?? []).map((a) => a.player_id));

  const toAdd = [...wanted].filter((p) => !have.has(p));
  const toRemove = [...have].filter((p) => !wanted.has(p));
  if (toAdd.length) {
    const { error } = await supabase.from("session_attendees").insert(toAdd.map((player_id) => ({ session_id: id, player_id })));
    if (error) return { error: errorMessage(error) };
  }
  if (toRemove.length) {
    const { error } = await supabase.from("session_attendees").delete().eq("session_id", id).in("player_id", toRemove);
    if (error) return { error: errorMessage(error) };
  }

  revalidateSession(id);
  return { ok: true };
}

export async function answerRsvp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const member = await requireMember();
  const id = String(formData.get("id"));
  const response = String(formData.get("response")) as RsvpResponse;
  if (!RSVP_RESPONSES.includes(response)) return { error: "Respuesta no válida." };

  const supabase = await createClient();
  const { error } = await supabase.from("rsvps").upsert({ session_id: id, player_id: member.playerId, response });
  if (error) return { error: errorMessage(error) };

  revalidateSession(id);
  return { ok: true };
}
