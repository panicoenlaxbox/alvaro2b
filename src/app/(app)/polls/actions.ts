"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { errorMessage, type ActionState } from "@/lib/action-state";
import { localDateTimeToIso } from "@/lib/domain/poll";
import { createClient } from "@/lib/supabase/server";

function revalidatePoll(pollId: string, sessionId?: string) {
  revalidatePath(`/polls/${pollId}`);
  if (sessionId) revalidatePath(`/sessions/${sessionId}`);
}

export async function openPoll(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const sessionId = String(formData.get("session_id"));
  const deadline = String(formData.get("closes_at") ?? "");
  const closesAt = deadline ? localDateTimeToIso(deadline) : null;
  if (deadline && !closesAt) return { error: "Fecha límite no válida." };
  if (closesAt && Date.parse(closesAt) <= Date.now()) return { error: "La fecha límite tiene que ser futura." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .insert({ session_id: sessionId, allow_veto: formData.get("allow_veto") === "on", closes_at: closesAt })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { error: "Esta sesión ya tiene votación." };
    if (error.code === "42501") return { error: "Solo se puede abrir una votación en una sesión de hoy o futura." };
    return { error: errorMessage(error) };
  }

  revalidatePoll(data.id, sessionId);
  redirect(`/polls/${data.id}`);
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
  if (!count) return { error: "Solo quien lo propuso o quien abrió la votación pueden quitarlo, y solo mientras está abierta." };

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

export async function setVeto(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const member = await requireMember();
  const pollId = String(formData.get("poll_id"));
  const candidateId = String(formData.get("candidate_id") ?? "");

  const supabase = await createClient();
  const { error } = candidateId
    ? await supabase.from("vetoes").upsert({ poll_id: pollId, player_id: member.playerId, candidate_id: candidateId })
    : await supabase.from("vetoes").delete().eq("poll_id", pollId).eq("player_id", member.playerId);
  if (error) return { error: error.code === "42501" ? "La votación está cerrada o no admite vetos." : errorMessage(error) };

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
  if (!data) return { error: "Solo quien abrió la votación puede cerrarla." };

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
  if (!data) return { error: "Solo quien abrió la votación decide los empates." };

  revalidatePoll(pollId);
  return { ok: true };
}
