import { getCurrentMember } from "@/lib/auth";
import { MEDIA_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_SECONDS = 60 * 60;

/** Admin only: signed URLs of every Photo, so the browser can zip them (PRD 9). */
export async function GET() {
  const member = await getCurrentMember();
  if (!member?.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const supabase = await createClient();
  const photos: { id: string; path: string; created_at: string; sessions: { date: string } | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("photos")
      .select("id, path, created_at, sessions(date)")
      .order("created_at")
      .range(from, from + 999);
    if (error) return Response.json({ error: "Database query failed" }, { status: 500 });
    photos.push(...data);
    if (data.length < 1000) break;
  }

  const urls = new Map<string, string>();
  for (let i = 0; i < photos.length; i += 500) {
    const { data } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrls(photos.slice(i, i + 500).map((p) => p.path), SIGNED_URL_SECONDS);
    for (const item of data ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }

  return Response.json(
    photos.map((p) => {
      const folder = p.sessions?.date ?? "album";
      const extension = p.path.split(".").pop();
      return { name: `${folder}/${p.created_at.slice(0, 10)}-${p.id.slice(0, 8)}.${extension}`, url: urls.get(p.path) ?? null };
    }),
    { headers: { "Cache-Control": "no-store" } },
  );
}
