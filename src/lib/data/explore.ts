import "server-only";
import type { ExplorableGame } from "@/lib/domain/explore";
import { createClient } from "@/lib/supabase/server";
import { toPeople, type Owner } from "./people";

export type CatalogGame = ExplorableGame & { coverPath: string | null; bggImageUrl: string | null; owners: Owner[] };

/** Every Game with the history and Ratings the explorer filters on. */
export async function listCatalogGames(): Promise<CatalogGame[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select(`
      id, name, min_players, max_players, min_duration, max_duration, complexity, default_play_mode, retired_at, cover_path, bgg_image_url,
      game_owners(players(id, display_name, avatar_url)), ratings(stars), plays(sessions(date))
    `)
    .order("name");

  return (data ?? []).map((g) => {
    const dates = g.plays.map((p) => p.sessions?.date).filter((d): d is string => Boolean(d)).sort();
    const total = g.ratings.reduce((s, r) => s + r.stars, 0);
    const owners = toPeople(g.game_owners);
    return {
      id: g.id,
      name: g.name,
      minPlayers: g.min_players,
      maxPlayers: g.max_players,
      minDuration: g.min_duration,
      maxDuration: g.max_duration,
      complexity: g.complexity === null ? null : Number(g.complexity),
      mode: g.default_play_mode,
      retired: g.retired_at !== null,
      playCount: g.plays.length,
      lastPlayed: dates.at(-1) ?? null,
      averageRating: g.ratings.length ? Math.round((total / g.ratings.length) * 10) / 10 : null,
      coverPath: g.cover_path,
      bggImageUrl: g.bgg_image_url,
      owners,
    };
  });
}

/** Every Game's name, retired or not, for pages that only need to name or pick them. */
export async function listGameNames(): Promise<{ id: string; name: string; retired: boolean }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("games").select("id, name, retired_at").order("name");
  return (data ?? []).map((g) => ({ id: g.id, name: g.name, retired: g.retired_at !== null }));
}
