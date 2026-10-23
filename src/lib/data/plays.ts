import "server-only";
import { cache } from "react";
import type { QueryData } from "@supabase/supabase-js";
import type { PlayMode } from "@/lib/domain/game-form";
import { createClient } from "@/lib/supabase/server";

export type PlayDetail = {
  id: string;
  sessionId: string;
  sessionDate: string;
  game: { id: string; name: string; lowerScoreWins: boolean };
  mode: PlayMode;
  durationMinutes: number | null;
  notes: string | null;
  coopWon: boolean | null;
  createdBy: string | null;
  expansions: { id: string; name: string }[];
  teams: { id: string; name: string; won: boolean }[];
  participants: { playerId: string; name: string; avatarUrl: string | null; score: number | null; rank: number | null; teamId: string | null }[];
};

const PLAY_SELECT = `
  id, session_id, play_mode, duration_minutes, notes, coop_won, created_by, created_at,
  sessions(date), games(id, name, lower_score_wins), play_expansions(expansions(id, name)), teams(id, name, won),
  participants(player_id, score, rank, team_id, players(display_name, avatar_url))
` as const;

const selectPlays = (supabase: Awaited<ReturnType<typeof createClient>>) => supabase.from("plays").select(PLAY_SELECT);
type PlayRow = QueryData<ReturnType<typeof selectPlays>>[number];

function toDetail(row: PlayRow): PlayDetail {
  return {
    id: row.id,
    sessionId: row.session_id,
    sessionDate: row.sessions?.date ?? "",
    game: { id: row.games?.id ?? "", name: row.games?.name ?? "?", lowerScoreWins: row.games?.lower_score_wins ?? false },
    mode: row.play_mode,
    durationMinutes: row.duration_minutes,
    notes: row.notes,
    coopWon: row.coop_won,
    createdBy: row.created_by,
    expansions: row.play_expansions.flatMap((pe) => (pe.expansions ? [pe.expansions] : [])),
    teams: row.teams,
    participants: row.participants
      .map((p) => ({
        playerId: p.player_id,
        name: p.players?.display_name ?? "?",
        avatarUrl: p.players?.avatar_url ?? null,
        score: p.score === null ? null : Number(p.score),
        rank: p.rank,
        teamId: p.team_id,
      }))
      .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || a.name.localeCompare(b.name, "es")),
  };
}

/** Cached per request: the Play page reads it in both generateMetadata and the page. */
export const getPlay = cache(async (id: string): Promise<PlayDetail | null> => {
  const { data } = await selectPlays(await createClient()).eq("id", id).maybeSingle();
  return data ? toDetail(data) : null;
});

export async function listSessionPlays(sessionId: string): Promise<PlayDetail[]> {
  const { data } = await selectPlays(await createClient()).eq("session_id", sessionId).order("created_at");
  return (data ?? []).map(toDetail);
}
