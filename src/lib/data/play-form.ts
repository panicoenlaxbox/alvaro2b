import "server-only";
import type { PlayMode } from "@/lib/domain/game-form";
import { createClient } from "@/lib/supabase/server";

export type PlayFormGame = {
  id: string;
  name: string;
  defaultMode: PlayMode;
  lowerScoreWins: boolean;
  retired: boolean;
  expansions: { id: string; name: string }[];
};

/** Games to choose from: the active ones, plus the current one even if it was retired. */
export async function listPlayFormGames(currentGameId?: string): Promise<PlayFormGame[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select("id, name, default_play_mode, lower_score_wins, retired_at, expansions(id, name, retired_at)")
    .order("name");

  return (data ?? [])
    .filter((g) => g.retired_at === null || g.id === currentGameId)
    .map((g) => ({
      id: g.id,
      name: g.name,
      defaultMode: g.default_play_mode,
      lowerScoreWins: g.lower_score_wins,
      retired: g.retired_at !== null,
      expansions: g.expansions
        .filter((e) => e.retired_at === null || g.id === currentGameId)
        .map((e) => ({ id: e.id, name: e.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    }));
}
