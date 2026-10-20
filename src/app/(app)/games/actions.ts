"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { errorMessage, type ActionState } from "@/lib/action-state";
import { parseGameForm, type GameFormValues } from "@/lib/domain/game-form";
import { ATTACHMENTS_BUCKET, MEDIA_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

function formValues(formData: FormData): GameFormValues {
  const values: GameFormValues = {};
  for (const key of [
    "name", "year", "min_players", "max_players", "min_duration", "max_duration", "complexity",
    "default_play_mode", "lower_score_wins", "bgg_id", "owner_id", "notes",
  ] as const) {
    const v = formData.get(key);
    values[key] = typeof v === "string" ? v : null;
  }
  return values;
}

export async function createGame(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const parsed = parseGameForm(formValues(formData));
  if (!parsed.ok) return { error: parsed.error };

  const bggImage = String(formData.get("bgg_image_url") ?? "");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .insert({ ...parsed.value, bgg_image_url: bggImage.startsWith("https://") ? bggImage : null })
    .select("id")
    .single();
  if (error) return { error: errorMessage(error) };

  revalidatePath("/games");
  redirect(`/games/${data.id}`);
}

export async function updateGame(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));
  const parsed = parseGameForm(formValues(formData));
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("games").update(parsed.value).eq("id", id).select("id").single();
  if (error) return { error: errorMessage(error) };

  revalidatePath("/games");
  redirect(`/games/${id}`);
}

export async function setGameRetired(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));
  const retired = formData.get("retired") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("games")
    .update({ retired_at: retired ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id")
    .single();
  if (error) return { error: errorMessage(error) };

  revalidatePath("/games");
  revalidatePath(`/games/${id}`);
  return { ok: true };
}

export async function deleteGame(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("cover_path, game_attachments(path)").eq("id", id).single();
  const { error, count } = await supabase.from("games").delete({ count: "exact" }).eq("id", id);
  if (error) {
    return { error: error.code === "23503" ? "No se puede borrar un juego con partidas. Retíralo en su lugar." : errorMessage(error) };
  }
  if (!count) return { error: "Solo quien lo añadió o el Admin pueden borrarlo." };
  if (game?.cover_path) await supabase.storage.from(MEDIA_BUCKET).remove([game.cover_path]);
  const files = (game?.game_attachments ?? []).flatMap((a) => (a.path ? [a.path] : []));
  if (files.length) await supabase.storage.from(ATTACHMENTS_BUCKET).remove(files);

  revalidatePath("/games");
  redirect("/games");
}

export async function rateGame(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const member = await requireMember();
  const gameId = String(formData.get("game_id"));
  const stars = Number(formData.get("stars"));

  const supabase = await createClient();
  const { error } =
    stars === 0
      ? await supabase.from("ratings").delete().eq("game_id", gameId).eq("player_id", member.playerId)
      : Number.isInteger(stars) && stars >= 1 && stars <= 5
        ? await supabase.from("ratings").upsert({ game_id: gameId, player_id: member.playerId, stars })
        : { error: { code: "23514", message: "" } };
  if (error) return { error: errorMessage(error) };

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/games");
  return { ok: true };
}

export async function setCover(gameId: string, path: string | null): Promise<ActionState> {
  await requireMember();
  if (path !== null && !path.startsWith(`covers/${gameId}/`)) return { error: "Ruta no válida." };

  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("cover_path").eq("id", gameId).single();
  const { error } = await supabase.from("games").update({ cover_path: path }).eq("id", gameId).select("id").single();
  if (error) return { error: errorMessage(error) };
  if (game?.cover_path && game.cover_path !== path) await supabase.storage.from(MEDIA_BUCKET).remove([game.cover_path]);

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/games");
  return { ok: true };
}

export async function addExpansion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const gameId = String(formData.get("game_id"));
  const name = String(formData.get("name") ?? "").trim();
  const ownerId = String(formData.get("owner_id") ?? "") || null;
  if (name.length < 1 || name.length > 120) return { error: "Escribe el nombre de la expansión." };

  const supabase = await createClient();
  const { error } = await supabase.from("expansions").insert({ game_id: gameId, name, owner_id: ownerId });
  if (error) return { error: errorMessage(error) };

  revalidatePath(`/games/${gameId}`);
  return { ok: true };
}

export async function setExpansionRetired(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));
  const gameId = String(formData.get("game_id"));
  const retired = formData.get("retired") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("expansions")
    .update({ retired_at: retired ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id")
    .single();
  if (error) return { error: errorMessage(error) };

  revalidatePath(`/games/${gameId}`);
  return { ok: true };
}

export async function deleteExpansion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));
  const gameId = String(formData.get("game_id"));

  const supabase = await createClient();
  const { error, count } = await supabase.from("expansions").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: error.code === "23503" ? "Se usó en alguna partida. Retírala en su lugar." : errorMessage(error) };
  if (!count) return { error: "Solo quien la añadió o el Admin pueden borrarla." };

  revalidatePath(`/games/${gameId}`);
  return { ok: true };
}
