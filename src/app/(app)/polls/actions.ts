"use server";

import { revalidatePath } from "next/cache";
import { RedirectType, redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { errorMessage, NOT_FOUND, type ActionState } from "@/lib/action-state";
import { joinDeadline, latestDeadline, parseDeadline } from "@/lib/domain/poll";
import { formatSessionTime } from "@/lib/domain/session";
import { createClient } from "@/lib/supabase/server";

function revalidatePoll(pollId: string, sessionId?: string) {
  revalidatePath(`/polls/${pollId}`);
  if (sessionId) revalidatePath(`/sessions/${sessionId}`);
}

export async function openPoll(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const sessionId = String(formData.get("session_id"));
  const date = String(formData.get("closes_date") ?? "");
  const time = String(formData.get("closes_time") ?? "");

  const supabase = await createClient();
  const { data: session } =
    date || time ? await supabase.from("sessions").select("date, start_time").eq("id", sessionId).maybeSingle() : { data: null };
  const startTime = session ? formatSessionTime(session.start_time) : null;
  const deadline = session ? joinDeadline(date, time, session.date, startTime) : { ok: true as const, value: "" };
  if (!deadline.ok) return { error: deadline.error };
  const closesAt = parseDeadline(deadline.value, session ? latestDeadline(session.date, startTime) : null);
  if (!closesAt.ok) return { error: closesAt.error };

  const { data, error } = await supabase
    .from("polls")
    .insert({ session_id: sessionId, closes_at: closesAt.value })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { error: "Esta sesión ya tiene votación." };
    if (error.code === "42501") return { error: "Solo se puede abrir una votación en una sesión de hoy o futura." };
    return { error: errorMessage(error) };
  }

  revalidatePoll(data.id, sessionId);
  redirect(`/polls/${data.id}`, RedirectType.replace);
}

export async function proposeCandidate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const member = await requireMember();
  const pollId = String(formData.get("poll_id"));
  const gameId = String(formData.get("game_id") ?? "");
  if (!gameId) return { error: "Elige un juego." };

  const supabase = await createClient();
  const { error } = await supabase.from("candidates").insert({ poll_id: pollId, game_id: gameId, added_by: member.playerId });
  if (error) {
    if (error.code === "23505") return { error: "Ese juego ya está propuesto." };
    if (error.code === "42501") return { error: "La votación está cerrada." };
    return { error: errorMessage(error) };
  }

  revalidatePoll(pollId);
  return { ok: true };
}

export async function withdrawCandidate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const pollId = String(formData.get("poll_id"));
  const id = String(formData.get("candidate_id"));

  const supabase = await createClient();
  const { error, count } = await supabase.from("candidates").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: errorMessage(error) };
  if (!count) return { error: "Solo se puede quitar mientras la votación está abierta." };

  revalidatePoll(pollId);
  return { ok: true };
}

export async function toggleApproval(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const member = await requireMember();
  const pollId = String(formData.get("poll_id"));
  const candidateId = String(formData.get("candidate_id"));
  const approve = formData.get("approve") === "true";

  const supabase = await createClient();
  const { error } = approve
    ? await supabase.from("approvals").insert({ candidate_id: candidateId, player_id: member.playerId })
    : await supabase.from("approvals").delete().eq("candidate_id", candidateId).eq("player_id", member.playerId);
  if (error && error.code !== "23505") return { error: error.code === "42501" ? "La votación está cerrada." : errorMessage(error) };

  revalidatePoll(pollId);
  return { ok: true };
}

export async function closePoll(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const pollId = String(formData.get("poll_id"));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .update({ closed_at: new Date().toISOString() })
    .eq("id", pollId)
    .select("session_id")
    .maybeSingle();
  if (error) return { error: errorMessage(error) };
  if (!data) return { error: NOT_FOUND };

  revalidatePoll(pollId, data.session_id);
  return { ok: true };
}

export async function toggleChosen(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const pollId = String(formData.get("poll_id"));
  const candidateId = String(formData.get("candidate_id"));
  const chosen = formData.get("chosen") === "true";

  const supabase = await createClient();
  const { data, error } = await supabase.from("candidates").update({ chosen }).eq("id", candidateId).select("id").maybeSingle();
  if (error) return { error: errorMessage(error) };
  if (!data) return { error: NOT_FOUND };

  revalidatePoll(pollId);
  return { ok: true };
}
