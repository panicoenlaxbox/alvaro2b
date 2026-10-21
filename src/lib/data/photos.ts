import "server-only";
import { signedUrls } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export type PhotoThumb = {
  id: string;
  thumbUrl: string | null;
  caption: string | null;
  /** The Session it belongs to; null for the Album. */
  session: { id: string; date: string } | null;
  /** The Players tagged in the Photo. */
  tagged: { name: string; avatarUrl: string | null }[];
};

/** Photos of a Session, of the general Album (sessionId null) or all of them (undefined). */
export async function listPhotos(sessionId?: string | null, limit = 300): Promise<PhotoThumb[]> {
  const supabase = await createClient();
  let query = supabase.from("photos").select("id, thumb_path, caption, session_id, sessions(date), photo_tags(players(display_name, avatar_url))").order("created_at", { ascending: false }).limit(limit);
  if (sessionId === null) query = query.is("session_id", null);
  else if (sessionId) query = query.eq("session_id", sessionId);
  const { data } = await query;
  const urls = await signedUrls((data ?? []).map((p) => p.thumb_path));
  return (data ?? []).map((p) => ({
    id: p.id,
    thumbUrl: urls.get(p.thumb_path) ?? null,
    caption: p.caption,
    session: p.session_id && p.sessions ? { id: p.session_id, date: p.sessions.date } : null,
    tagged: p.photo_tags.flatMap((t) => (t.players ? [{ name: t.players.display_name, avatarUrl: t.players.avatar_url }] : [])),
  }));
}
