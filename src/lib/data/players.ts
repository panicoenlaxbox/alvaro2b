import "server-only";
import { createClient } from "@/lib/supabase/server";

/** `active` is false for deactivated Members: pickers hide them, history still shows their name. */
export type PlayerOption = { id: string; display_name: string; avatar_url: string | null; is_member: boolean; active: boolean };

export async function listPlayers(): Promise<PlayerOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("players").select("id, display_name, avatar_url, user_id, deactivated_at").order("display_name");
  return (data ?? []).map((p) => ({ id: p.id, display_name: p.display_name, avatar_url: p.avatar_url, is_member: p.user_id !== null, active: p.deactivated_at === null }));
}

export async function listMembers(): Promise<PlayerOption[]> {
  return (await listPlayers()).filter((p) => p.is_member);
}
