import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentMember = {
  userId: string;
  playerId: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
  isAdmin: boolean;
};

/** The request's Supabase client and the signed-in user's claims (null when signed out). Cached per request. */
const getAuth = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, claims: data?.claims ?? null };
});

/**
 * The signed-in Member, or null when signed out or no longer on the allowlist.
 * Cached per request.
 */
export const getCurrentMember = cache(async (): Promise<CurrentMember | null> => {
  const { supabase, claims } = await getAuth();
  const userId = claims?.sub;
  if (!userId) return null;

  const { data } = await supabase
    .from("players")
    .select("id, display_name, avatar_url, allowed_emails(email, is_admin)")
    .eq("user_id", userId)
    .maybeSingle();

  const allowed = data?.allowed_emails;
  if (!data || !allowed) return null;

  return {
    userId,
    playerId: data.id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    email: allowed.email,
    isAdmin: allowed.is_admin,
  };
});

/** Use in pages and actions that need a Member; redirects otherwise. */
export async function requireMember(): Promise<CurrentMember> {
  const member = await getCurrentMember();
  if (member) return member;
  const { claims } = await getAuth();
  redirect(claims ? "/not-allowed" : "/login");
}

export async function requireAdmin(): Promise<CurrentMember> {
  const member = await requireMember();
  if (!member.isAdmin) redirect("/");
  return member;
}
