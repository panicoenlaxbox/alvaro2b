import "server-only";
import { signedUrls } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { toPeople, type Person } from "./people";
import { SESSION_SUMMARY_SELECT, sessionSummary, type SessionSummary } from "./sessions";

export type PhotoThumb = {
  id: string;
  thumbUrl: string | null;
  caption: string | null;
  /** The Session it belongs to; null for the Album. */
  session: SessionSummary | null;
  /** The Players tagged in the Photo. */
  tagged: Person[];
};

/** Photos of a Session, of the general Album (sessionId null) or all of them (undefined). */
export async function listPhotos(sessionId?: string | null, limit = 300): Promise<PhotoThumb[]> {
  const supabase = await createClient();
  let query = supabase.from("photos").select(`id, thumb_path, caption, session_id, sessions(${SESSION_SUMMARY_SELECT}), photo_tags(players(id, display_name, avatar_url))`).order("created_at", { ascending: false }).limit(limit);
  if (sessionId === null) query = query.is("session_id", null);
  else if (sessionId) query = query.eq("session_id", sessionId);
  const { data } = await query;
  const urls = await signedUrls((data ?? []).map((p) => p.thumb_path));
  return (data ?? []).map((p) => ({
    id: p.id,
    thumbUrl: urls.get(p.thumb_path) ?? null,
    caption: p.caption,
    session: p.session_id && p.sessions ? sessionSummary(p.session_id, p.sessions) : null,
    tagged: toPeople(p.photo_tags),
  }));
}
