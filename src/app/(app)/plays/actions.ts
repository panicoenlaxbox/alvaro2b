"use server";

import { revalidatePath } from "next/cache";
import { RedirectType, redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { errorMessage, type ActionState } from "@/lib/action-state";
import { parsePlayInput, toSavePlayPayload, validatePlay } from "@/lib/domain/play";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

function revalidatePlay(sessionId: string, playId?: string) {
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
  revalidatePath("/");
  if (playId) revalidatePath(`/plays/${playId}`);
}

/** Saves a Play from the form's JSON. */
export async function savePlay(json: string): Promise<ActionState> {
  await requireMember();
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { error: "Datos no válidos." };
  }
  const input = parsePlayInput(raw);
  if (!input) return { error: "Datos no válidos." };

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

export async function deletePlay(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { data: play } = await supabase.from("plays").select("session_id").eq("id", id).maybeSingle();
  const { error, count } = await supabase.from("plays").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: errorMessage(error) };
  if (!count || !play) return { error: "No se ha encontrado; puede que ya se haya eliminado." };

  revalidatePlay(play.session_id);
  return { ok: true, leaveTo: `/sessions/${play.session_id}` };
}
