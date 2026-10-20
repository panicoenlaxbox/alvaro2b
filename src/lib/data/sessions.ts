import "server-only";
import type { SessionStatus } from "@/lib/domain/session";
import { createClient } from "@/lib/supabase/server";

export type SessionListItem = {
  id: string;
  date: string;
  name: string | null;
  place: string | null;
  status: SessionStatus;
  playCount: number;
  attendeeCount: number;
};

export async function listSessions(): Promise<SessionListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select("id, date, name, place, status, session_attendees(count), plays(count)")
    .order("date", { ascending: false });

  return (data ?? []).map((s) => ({
    id: s.id,
    date: s.date,
    name: s.name,
    place: s.place,
    status: s.status,
    playCount: s.plays[0]?.count ?? 0,
    attendeeCount: s.session_attendees[0]?.count ?? 0,
  }));
}
