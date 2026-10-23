import "server-only";
import type { StatsGame, StatsPlay, StatsSession } from "@/lib/domain/stats";
import { createClient } from "@/lib/supabase/server";

export type StatsData = {
  plays: StatsPlay[];
  sessions: StatsSession[];
  games: StatsGame[];
  players: { id: string; name: string; isMember: boolean }[];
};

/** The whole history. A group of friends generates a few hundred Plays a year, so this stays small. */
export async function loadStatsData(): Promise<StatsData> {
  const supabase = await createClient();
  const [plays, sessions, games, players] = await Promise.all([
    supabase
      .from("plays")
      .select("id, session_id, game_id, play_mode, duration_minutes, coop_won, sessions(date), participants(player_id, rank, team_id), teams(id, won)"),
    supabase.from("sessions").select("id, date, session_attendees(player_id)"),
    supabase.from("games").select("id, name, retired_at, min_duration, max_duration").order("name"),
    supabase.from("players").select("id, display_name, user_id").order("display_name"),
  ]);

  return {
    plays: (plays.data ?? []).map((p) => ({
      id: p.id,
      sessionId: p.session_id,
      date: p.sessions?.date ?? "",
      gameId: p.game_id,
      mode: p.play_mode,
      durationMinutes: p.duration_minutes,
      coopWon: p.coop_won,
      participants: p.participants.map((x) => ({ playerId: x.player_id, rank: x.rank, teamId: x.team_id })),
      teams: p.teams,
    })),
    sessions: (sessions.data ?? []).map((s) => ({
      id: s.id,
      date: s.date,
      attendees: s.session_attendees.map((a) => a.player_id),
    })),
    games: (games.data ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      retired: g.retired_at !== null,
      minDuration: g.min_duration,
      maxDuration: g.max_duration,
    })),
    players: (players.data ?? []).map((p) => ({ id: p.id, name: p.display_name, isMember: p.user_id !== null })),
  };
}
