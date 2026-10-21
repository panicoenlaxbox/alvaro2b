"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { errorMessage, type ActionState } from "@/lib/action-state";
import { PHOTO_CAPTION_MAX } from "@/lib/domain/photos";
import { MEDIA_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export type UploadedPhoto = {
  path: string;
  thumbPath: string;
  width: number;
  height: number;
  sizeBytes: number;
};

function revalidatePhotos(sessionId: string | null, photoId?: string) {
  revalidatePath("/photos");
  if (sessionId) revalidatePath(`/sessions/${sessionId}`);
  if (photoId) revalidatePath(`/photos/${photoId}`);
}

/** Records Photos whose files the browser already uploaded to the media bucket. */
export async function recordPhotos(sessionId: string | null, photos: UploadedPhoto[]): Promise<ActionState> {
  const member = await requireMember();
  const valid = photos.filter(
    (p) => /^photos\/[\w-]+\.(webp|jpg)$/.test(p.path) && /^photos\/thumbs\/[\w-]+\.(webp|jpg)$/.test(p.thumbPath),
  );
  if (valid.length !== photos.length || valid.length === 0) return { error: "Fotos no válidas." };

  const supabase = await createClient();
  const { error } = await supabase.from("photos").insert(
    valid.map((p) => ({
      session_id: sessionId,
      path: p.path,
      thumb_path: p.thumbPath,
      width: p.width,
      height: p.height,
      size_bytes: p.sizeBytes,
      uploaded_by: member.userId,
    })),
  );
  if (error) {
    await supabase.storage.from(MEDIA_BUCKET).remove(valid.flatMap((p) => [p.path, p.thumbPath]));
    return { error: errorMessage(error) };
  }

  revalidatePhotos(sessionId);
  return { ok: true };
}

export async function updatePhoto(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));
  const caption = String(formData.get("caption") ?? "").trim();
  const playId = String(formData.get("play_id") ?? "") || null;
  const tagged = formData.getAll("tag").map(String);
  if (caption.length > PHOTO_CAPTION_MAX) return { error: "El pie de foto es demasiado largo." };

  const supabase = await createClient();
  const { data: photo, error } = await supabase
    .from("photos")
    .update({ caption: caption || null, play_id: playId })
    .eq("id", id)
    .select("session_id")
    .single();
  if (error) return { error: error.message === "The Play is not in this Session" ? "Esa partida no es de esta sesión." : errorMessage(error) };

  const { error: deleteError } = await supabase.from("photo_tags").delete().eq("photo_id", id);
  if (deleteError) return { error: errorMessage(deleteError) };
  if (tagged.length) {
    const { error: tagError } = await supabase.from("photo_tags").insert(tagged.map((player_id) => ({ photo_id: id, player_id })));
    if (tagError) return { error: errorMessage(tagError) };
  }

  revalidatePhotos(photo.session_id, id);
  return { ok: true };
}

export async function deletePhoto(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { data: photo } = await supabase.from("photos").select("session_id, path, thumb_path").eq("id", id).maybeSingle();
  const { error, count } = await supabase.from("photos").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: errorMessage(error) };
  if (!count || !photo) return { error: "No se ha encontrado; puede que ya se haya eliminado." };
  await supabase.storage.from(MEDIA_BUCKET).remove([photo.path, photo.thumb_path]);

  revalidatePhotos(photo.session_id);
  return { ok: true, leaveTo: photo.session_id ? `/sessions/${photo.session_id}` : "/photos" };
}
