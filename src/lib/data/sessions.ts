import "server-only";
import { formatSessionTime } from "@/lib/domain/session";
import { createClient } from "@/lib/supabase/server";
import { toPeople, type Person } from "./people";

export type SessionListItem = {
  id: string;
  date: string;
  /** "20:30", or null when the Session has no start time. */
  time: string | null;
  name: string | null;
  place: string | null;
  attendees: (Person & { maybe: boolean })[];
};

export async function listSessions(): Promise<SessionListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select("id, date, start_time, name, place, session_attendees(maybe, players(id, display_name, avatar_url))")
    .order("date", { ascending: false });

  return (data ?? []).map((s) => ({
    id: s.id,
    date: s.date,
    time: formatSessionTime(s.start_time),
    name: s.name,
    place: s.place,
    // By name, as toPeople sorts them.
    attendees: toPeople(s.session_attendees).map((o) => ({ ...o, maybe: s.session_attendees.some((a) => a.maybe && a.players?.id === o.id) })),
  }));
}

/** What SessionHeader shows of a Session, above its Photos, a Play or a Poll. */
export type SessionSummary = {
  id: string;
  date: string;
  name: string | null;
  place: string | null;
  /** Games played, each once, in the order of the Plays. */
  games: { id: string; name: string }[];
  attendees: Person[];
};

/** The `sessions(...)` columns sessionSummary reads; interpolate it into a select. Plays carry their id for the Photo page. */
export const SESSION_SUMMARY_SELECT =
  "date, name, place, plays(id, created_at, games(id, name)), session_attendees(players(id, display_name, avatar_url))" as const;

/** Builds a SessionSummary from a `sessions(${SESSION_SUMMARY_SELECT})` select. */
export function sessionSummary(
  id: string,
  s: {
    date: string;
    name: string | null;
    place: string | null;
    plays: { created_at: string; games: { id: string; name: string } | null }[];
    session_attendees: { players: { id: string; display_name: string; avatar_url: string | null } | null }[];
  },
): SessionSummary {
  const plays = [...s.plays].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return {
    id,
    date: s.date,
    name: s.name,
    place: s.place,
    games: [...new Map(plays.flatMap((p) => (p.games ? [[p.games.id, p.games] as const] : []))).values()],
    attendees: toPeople(s.session_attendees),
  };
}
