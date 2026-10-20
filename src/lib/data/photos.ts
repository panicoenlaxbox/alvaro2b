import "server-only";
import { signedUrls } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export type PhotoThumb = { id: string; thumbUrl: string | null; caption: string | null; sessionId: string | null };

/** Photos of a Session, of the general Album (sessionId null) or all of them (undefined). */
export async function listPhotos(sessionId?: string | null, limit = 300): Promise<PhotoThumb[]> {
  const supabase = await createClient();
  let query = supabase.from("photos").select("id, thumb_path, caption, session_id").order("created_at", { ascending: false }).limit(limit);
  if (sessionId === null) query = query.is("session_id", null);
  else if (sessionId) query = query.eq("session_id", sessionId);
  const { data } = await query;
  const urls = await signedUrls((data ?? []).map((p) => p.thumb_path));
  return (data ?? []).map((p) => ({ id: p.id, thumbUrl: urls.get(p.thumb_path) ?? null, caption: p.caption, sessionId: p.session_id }));
}
