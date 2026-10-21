import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toOwners, type Owner } from "./explore";

export type SessionListItem = {
  id: string;
  date: string;
  name: string | null;
  place: string | null;
  playCount: number;
  attendeeCount: number;
  attendees: Owner[];
};

export async function listSessions(): Promise<SessionListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select("id, date, name, place, session_attendees(players(id, display_name, avatar_url)), plays(count)")
    .order("date", { ascending: false });

  return (data ?? []).map((s) => ({
    id: s.id,
    date: s.date,
    name: s.name,
    place: s.place,
    playCount: s.plays[0]?.count ?? 0,
    attendeeCount: s.session_attendees.length,
    attendees: toOwners(s.session_attendees),
  }));
}
