import "server-only";
import { signedUrls } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

/** What the Photos page shows above each Session's Photos. */
export type PhotoSession = {
  id: string;
  date: string;
  name: string | null;
  place: string | null;
  /** Games played, each once, in the order of the Plays. */
  games: { id: string; name: string }[];
  attendees: { name: string; avatarUrl: string | null }[];
};

export type PhotoThumb = {
  id: string;
  thumbUrl: string | null;
  caption: string | null;
  /** The Session it belongs to; null for the Album. */
  session: PhotoSession | null;
  /** The Players tagged in the Photo. */
  tagged: { name: string; avatarUrl: string | null }[];
};

const byName = <T extends { name: string }>(people: T[]) => people.sort((a, b) => a.name.localeCompare(b.name, "es"));

/** Builds a PhotoSession from a `sessions(date, name, place, plays(created_at, games(id, name)), session_attendees(players(display_name, avatar_url)))` select. */
export function photoSession(
  id: string,
  s: {
    date: string;
    name: string | null;
    place: string | null;
    plays: { created_at: string; games: { id: string; name: string } | null }[];
    session_attendees: { players: { display_name: string; avatar_url: string | null } | null }[];
  },
): PhotoSession {
  const plays = [...s.plays].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return {
    id,
    date: s.date,
    name: s.name,
    place: s.place,
    games: [...new Map(plays.flatMap((p) => (p.games ? [[p.games.id, p.games] as const] : []))).values()],
    attendees: byName(s.session_attendees.flatMap((a) => (a.players ? [{ name: a.players.display_name, avatarUrl: a.players.avatar_url }] : []))),
  };
}

/** Photos of a Session, of the general Album (sessionId null) or all of them (undefined). */
export async function listPhotos(sessionId?: string | null, limit = 300): Promise<PhotoThumb[]> {
  const supabase = await createClient();
  let query = supabase.from("photos").select("id, thumb_path, caption, session_id, sessions(date, name, place, plays(created_at, games(id, name)), session_attendees(players(display_name, avatar_url))), photo_tags(players(display_name, avatar_url))").order("created_at", { ascending: false }).limit(limit);
  if (sessionId === null) query = query.is("session_id", null);
  else if (sessionId) query = query.eq("session_id", sessionId);
  const { data } = await query;
  const urls = await signedUrls((data ?? []).map((p) => p.thumb_path));
  return (data ?? []).map((p) => ({
    id: p.id,
    thumbUrl: urls.get(p.thumb_path) ?? null,
    caption: p.caption,
    session: p.session_id && p.sessions ? photoSession(p.session_id, p.sessions) : null,
    tagged: byName(p.photo_tags.flatMap((t) => (t.players ? [{ name: t.players.display_name, avatarUrl: t.players.avatar_url }] : []))),
  }));
}
