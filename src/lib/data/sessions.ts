import "server-only";
import { formatSessionTime } from "@/lib/domain/session";
import { createClient } from "@/lib/supabase/server";
import { toOwners, type Owner } from "./explore";

export type SessionListItem = {
  id: string;
  date: string;
  /** "20:30", or null when the Session has no start time. */
  time: string | null;
  name: string | null;
  place: string | null;
  attendeeCount: number;
  attendees: (Owner & { maybe: boolean })[];
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
    attendeeCount: s.session_attendees.length,
    // By name, as toOwners sorts them.
    attendees: toOwners(s.session_attendees).map((o) => ({ ...o, maybe: s.session_attendees.some((a) => a.maybe && a.players?.id === o.id) })),
  }));
}
