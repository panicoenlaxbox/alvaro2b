import "server-only";
import type { ExplorableGame } from "@/lib/domain/explore";
import { createClient } from "@/lib/supabase/server";

export type CatalogGame = ExplorableGame & { coverPath: string | null; bggImageUrl: string | null; ownerName: string | null };

/** Every Game with the history and Ratings the explorer filters on. */
export async function listCatalogGames(myPlayerId: string): Promise<CatalogGame[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select(
      "id, name, min_players, max_players, min_duration, max_duration, complexity, default_play_mode, owner_id, retired_at, cover_path, bgg_image_url, " +
        "owner:players!games_owner_id_fkey(display_name), ratings(player_id, stars), plays(sessions(date))",
    )
    .order("name");

  type Row = {
    id: string;
    name: string;
    min_players: number | null;
    max_players: number | null;
    min_duration: number | null;
    max_duration: number | null;
    complexity: number | null;
    default_play_mode: ExplorableGame["mode"];
    owner_id: string | null;
    retired_at: string | null;
    cover_path: string | null;
    bgg_image_url: string | null;
    owner: { display_name: string } | null;
    ratings: { player_id: string; stars: number }[];
    plays: { sessions: { date: string } | null }[];
  };

  return ((data ?? []) as unknown as Row[]).map((g) => {
    const dates = g.plays.map((p) => p.sessions?.date).filter((d): d is string => Boolean(d)).sort();
    const total = g.ratings.reduce((s, r) => s + r.stars, 0);
    return {
      id: g.id,
      name: g.name,
      minPlayers: g.min_players,
      maxPlayers: g.max_players,
      minDuration: g.min_duration,
      maxDuration: g.max_duration,
      complexity: g.complexity === null ? null : Number(g.complexity),
      mode: g.default_play_mode,
      ownerId: g.owner_id,
      retired: g.retired_at !== null,
      playCount: g.plays.length,
      lastPlayed: dates.at(-1) ?? null,
      averageRating: g.ratings.length ? Math.round((total / g.ratings.length) * 10) / 10 : null,
      myRating: g.ratings.find((r) => r.player_id === myPlayerId)?.stars ?? null,
      coverPath: g.cover_path,
      bggImageUrl: g.bgg_image_url,
      ownerName: g.owner?.display_name ?? null,
    };
  });
}
