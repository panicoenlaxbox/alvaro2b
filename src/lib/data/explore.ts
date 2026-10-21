import "server-only";
import type { ExplorableGame } from "@/lib/domain/explore";
import { createClient } from "@/lib/supabase/server";

/** An owner as the catalogue shows it: a face and a name. */
export type Owner = { id: string; name: string; avatarUrl: string | null };

export type CatalogGame = ExplorableGame & { coverPath: string | null; bggImageUrl: string | null; owners: Owner[] };

/** Owners as Supabase returns them through a join table, sorted by name. */
export function toOwners(rows: { players: { id: string; display_name: string; avatar_url: string | null } | null }[]): Owner[] {
  return rows
    .flatMap((r) => (r.players ? [{ id: r.players.id, name: r.players.display_name, avatarUrl: r.players.avatar_url }] : []))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

/** Every Game with the history and Ratings the explorer filters on. */
export async function listCatalogGames(): Promise<CatalogGame[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select(
      "id, name, min_players, max_players, min_duration, max_duration, complexity, default_play_mode, retired_at, cover_path, bgg_image_url, " +
        "game_owners(players(id, display_name, avatar_url)), ratings(stars), plays(sessions(date))",
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
    retired_at: string | null;
    cover_path: string | null;
    bgg_image_url: string | null;
    game_owners: { players: { id: string; display_name: string; avatar_url: string | null } | null }[];
    ratings: { stars: number }[];
    plays: { sessions: { date: string } | null }[];
  };

  return ((data ?? []) as unknown as Row[]).map((g) => {
    const dates = g.plays.map((p) => p.sessions?.date).filter((d): d is string => Boolean(d)).sort();
    const total = g.ratings.reduce((s, r) => s + r.stars, 0);
    const owners = toOwners(g.game_owners);
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
