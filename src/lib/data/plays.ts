import "server-only";
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

const PLAY_SELECT =
  "id, session_id, play_mode, duration_minutes, notes, coop_won, created_by, created_at, " +
  "sessions(date), games(id, name, lower_score_wins), play_expansions(expansions(id, name)), teams(id, name, won), " +
  "participants(player_id, score, rank, team_id, players(display_name, avatar_url))";

type PlayRow = {
  id: string;
  session_id: string;
  play_mode: PlayMode;
  duration_minutes: number | null;
  notes: string | null;
  coop_won: boolean | null;
  created_by: string | null;
  created_at: string;
  sessions: { date: string } | null;
  games: { id: string; name: string; lower_score_wins: boolean } | null;
  play_expansions: { expansions: { id: string; name: string } | null }[];
  teams: { id: string; name: string; won: boolean }[];
  participants: { player_id: string; score: number | null; rank: number | null; team_id: string | null; players: { display_name: string; avatar_url: string | null } | null }[];
};

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

export async function getPlay(id: string): Promise<PlayDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("plays").select(PLAY_SELECT).eq("id", id).maybeSingle();
  return data ? toDetail(data as unknown as PlayRow) : null;
}

export async function listSessionPlays(sessionId: string): Promise<PlayDetail[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("plays").select(PLAY_SELECT).eq("session_id", sessionId).order("created_at");
  return ((data ?? []) as unknown as PlayRow[]).map(toDetail);
}
