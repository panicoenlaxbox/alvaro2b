import "server-only";
import { createClient } from "@/lib/supabase/server";

export const MEDIA_BUCKET = "media";
export const ATTACHMENTS_BUCKET = "attachments";
const SIGNED_URL_SECONDS = 60 * 60;

/** Signed URLs for private files, created with the Member's own session (RLS applies). */
export async function signedUrls(paths: (string | null | undefined)[], bucket = MEDIA_BUCKET): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  const urls = new Map<string, string>();
  if (unique.length === 0) return urls;

  const supabase = await createClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrls(unique, SIGNED_URL_SECONDS);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}

/** Cover to show for a Game: our own upload wins over the linked BGG image. */
export function coverUrl(game: { cover_path: string | null; bgg_image_url: string | null }, signed: Map<string, string>) {
  return (game.cover_path && signed.get(game.cover_path)) || game.bgg_image_url || null;
}
