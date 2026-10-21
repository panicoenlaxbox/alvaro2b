"use server";

import { revalidatePath } from "next/cache";
import { RedirectType, redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { errorMessage, type ActionState } from "@/lib/action-state";
import { minutesBetween, parsePlayInput, toSavePlayPayload, validatePlay } from "@/lib/domain/play";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

function revalidatePlay(sessionId: string, playId?: string) {
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
  revalidatePath("/");
  if (playId) revalidatePath(`/plays/${playId}`);
}

/**
 * Saves a Play from the form's JSON. With `start`, it only records who plays what and starts the
 * timer now; results are added when the Play ends.
 */
export async function savePlay(json: string, start = false): Promise<ActionState> {
  await requireMember();
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { error: "Datos no válidos." };
  }
  const input = parsePlayInput(raw);
  if (!input) return { error: "Datos no válidos." };
  if (start) {
    input.startedAt = new Date().toISOString();
    input.endedAt = null;
    input.durationMinutes = null;
    // Teams are known at the start; results are not.
    input.coopWon = null;
    input.teams = input.teams.map((t) => ({ ...t, won: false }));
    input.participants = input.participants.map((p) => ({ ...p, score: null, rank: null }));
  }

  const validation = validatePlay(input);
  if (!validation.ok) return { error: validation.error };

  const supabase = await createClient();
  // The Ranking depends on the Game's "lower score wins" at the time of saving.
  const { data: game } = await supabase.from("games").select("lower_score_wins").eq("id", input.gameId).maybeSingle();
  if (!game) return { error: "Elige el juego." };

  const { data: playId, error } = await supabase.rpc("save_play", {
    play: toSavePlayPayload(input, game.lower_score_wins) as unknown as Json,
  });
  if (error) return { error: errorMessage(error) };

  revalidatePlay(input.sessionId, playId);
  redirect(`/plays/${playId}`, RedirectType.replace);
}

export async function finishPlay(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { data: play } = await supabase.from("plays").select("session_id, started_at").eq("id", id).maybeSingle();
  if (!play?.started_at) return { error: "La partida no tiene cronómetro en marcha." };

  const endedAt = new Date().toISOString();
  const { error } = await supabase
    .from("plays")
    .update({ ended_at: endedAt, duration_minutes: Math.min(6000, minutesBetween(play.started_at, endedAt)) })
    .eq("id", id)
    .select("id")
    .single();
  if (error) return { error: errorMessage(error) };

  revalidatePlay(play.session_id, id);
  redirect(`/plays/${id}/edit`, RedirectType.replace);
}

export async function deletePlay(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { data: play } = await supabase.from("plays").select("session_id").eq("id", id).maybeSingle();
  const { error, count } = await supabase.from("plays").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: errorMessage(error) };
  if (!count || !play) return { error: "Solo quien la registró o el Admin pueden eliminarla." };

  revalidatePlay(play.session_id);
  return { ok: true, leaveTo: `/sessions/${play.session_id}` };
}
