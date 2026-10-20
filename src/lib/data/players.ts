import "server-only";
import { createClient } from "@/lib/supabase/server";

export type PlayerOption = { id: string; display_name: string; is_member: boolean };

export async function listPlayers(): Promise<PlayerOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("players").select("id, display_name, user_id").order("display_name");
  return (data ?? []).map((p) => ({ id: p.id, display_name: p.display_name, is_member: p.user_id !== null }));
}

export async function listMembers(): Promise<PlayerOption[]> {
  return (await listPlayers()).filter((p) => p.is_member);
}
