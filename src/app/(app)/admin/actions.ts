"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { errorMessage, NOT_FOUND, type ActionState } from "@/lib/action-state";
import { isValidEmail, parsePlayerName } from "@/lib/domain/players";
import { createClient } from "@/lib/supabase/server";

export async function addAllowedEmail(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const guestId = String(formData.get("guest_id") ?? "") || null;
  const isAdmin = formData.get("is_admin") === "on";
  if (!isValidEmail(email)) return { error: "Escribe un email válido." };

  const supabase = await createClient();
  const { error } = await supabase.from("allowed_emails").insert({ email, player_id: guestId, is_admin: isAdmin });
  if (error) return { error: error.code === "23505" ? "Ese email ya está en la lista de miembros." : errorMessage(error) };

  revalidatePath("/admin");
  return { ok: true };
}

export async function setAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const email = String(formData.get("email"));
  const isAdmin = formData.get("is_admin") === "true";

  const supabase = await createClient();
  const { error } = await supabase.from("allowed_emails").update({ is_admin: isAdmin }).eq("email", email).select("email").single();
  if (error) return { error: errorMessage(error) };

  revalidatePath("/admin");
  return { ok: true };
}

export async function removeAllowedEmail(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const email = String(formData.get("email"));

  const supabase = await createClient();
  const { error } = await supabase.from("allowed_emails").delete().eq("email", email);
  if (error) return { error: errorMessage(error) };

  revalidatePath("/admin");
  return { ok: true };
}

export async function setMemberActive(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const playerId = String(formData.get("player_id"));
  const active = formData.get("active") === "true";

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_active", { target: playerId, active });
  if (error) return { error: errorMessage(error) };

  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const playerId = String(formData.get("player_id"));

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_member", { target: playerId });
  if (error) return { error: error.code === "23503" ? "Tiene historial, así que no se puede eliminar. Desactívalo." : errorMessage(error) };

  revalidatePath("/admin");
  return { ok: true };
}

const TAKEN_GUEST_NAME = "Ya hay un invitado con ese nombre.";

export async function addGuest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = parsePlayerName(String(formData.get("display_name") ?? ""));
  if (!name.ok) return { error: name.error };

  const supabase = await createClient();
  const { error } = await supabase.from("players").insert({ display_name: name.value });
  if (error) return { error: error.code === "23505" ? TAKEN_GUEST_NAME : errorMessage(error) };

  revalidatePath("/admin");
  return { ok: true };
}

export async function renamePlayer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const name = parsePlayerName(String(formData.get("display_name") ?? ""));
  if (!name.ok) return { error: name.error };

  const supabase = await createClient();
  const { error } = await supabase.from("players").update({ display_name: name.value }).eq("id", id).select("id").single();
  if (error) return { error: error.code === "23505" ? TAKEN_GUEST_NAME : errorMessage(error) };

  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteGuest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { error, count } = await supabase.from("players").delete({ count: "exact" }).eq("id", id).is("user_id", null);
  if (error) return { error: error.code === "23503" ? "Tiene historial, así que no se puede eliminar. Desactívalo." : errorMessage(error) };
  if (!count) return { error: NOT_FOUND };

  revalidatePath("/admin");
  return { ok: true };
}

export async function setGuestActive(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_guest_active", { target: id, active });
  if (error) return { error: errorMessage(error) };

  revalidatePath("/admin");
  return { ok: true };
}
