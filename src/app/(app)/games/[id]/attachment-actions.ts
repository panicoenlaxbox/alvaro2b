"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { errorMessage, type ActionState } from "@/lib/action-state";
import { ATTACHMENT_MAX_BYTES, parseAttachmentLink } from "@/lib/domain/attachments";
import { ATTACHMENTS_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export async function addAttachmentLink(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const gameId = String(formData.get("game_id"));
  const url = parseAttachmentLink(String(formData.get("url") ?? ""));
  if (!url) return { error: "Escribe un enlace válido (https://…)." };

  const supabase = await createClient();
  const { error } = await supabase.from("game_attachments").insert({ game_id: gameId, kind: "link", url });
  if (error) return { error: errorMessage(error) };

  revalidatePath(`/games/${gameId}`);
  return { ok: true };
}

/** Records a file the browser has already uploaded to the attachments bucket. */
export async function recordAttachmentFile(gameId: string, file: { path: string; fileName: string; sizeBytes: number }): Promise<ActionState> {
  await requireMember();
  if (!file.path.startsWith(`games/${gameId}/`) || file.sizeBytes <= 0 || file.sizeBytes > ATTACHMENT_MAX_BYTES) {
    return { error: "No se ha podido guardar el fichero." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("game_attachments")
    .insert({ game_id: gameId, kind: "file", path: file.path, file_name: file.fileName.slice(0, 200), size_bytes: file.sizeBytes });
  if (error) {
    await supabase.storage.from(ATTACHMENTS_BUCKET).remove([file.path]);
    return { error: errorMessage(error) };
  }

  revalidatePath(`/games/${gameId}`);
  return { ok: true };
}

export async function deleteAttachment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { data, error } = await supabase.from("game_attachments").delete().eq("id", id).select("game_id, path").single();
  if (error) return { error: errorMessage(error) };
  if (data.path) await supabase.storage.from(ATTACHMENTS_BUCKET).remove([data.path]);

  revalidatePath(`/games/${data.game_id}`);
  return { ok: true };
}
