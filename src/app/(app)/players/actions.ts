"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { errorMessage, type ActionState } from "@/lib/action-state";
import { createClient } from "@/lib/supabase/server";

function nameFrom(formData: FormData): string | null {
  const name = String(formData.get("display_name") ?? "").trim();
  return name.length >= 1 && name.length <= 60 ? name : null;
}

export async function addGuest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const name = nameFrom(formData);
  if (!name) return { error: "Escribe un nombre (máximo 60 caracteres)." };

  const supabase = await createClient();
  const { error } = await supabase.from("players").insert({ display_name: name });
  if (error) return { error: errorMessage(error) };

  revalidatePath("/players");
  return { ok: true, message: `${name} añadido como invitado.` };
}

export async function renamePlayer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));
  const name = nameFrom(formData);
  if (!name) return { error: "Escribe un nombre (máximo 60 caracteres)." };

  const supabase = await createClient();
  const { error } = await supabase.from("players").update({ display_name: name }).eq("id", id).select("id").single();
  if (error) return { error: errorMessage(error) };

  revalidatePath("/players");
  return { ok: true, message: "Guardado." };
}

export async function deleteGuest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireMember();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { error, count } = await supabase.from("players").delete({ count: "exact" }).eq("id", id).is("user_id", null);
  if (error) return { error: errorMessage(error) };
  if (!count) return { error: "Solo quien lo creó o el Admin pueden borrar este invitado." };

  revalidatePath("/players");
  return { ok: true };
}
