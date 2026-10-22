import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";

// Called once a day by Vercel Cron (vercel.json) so the free Supabase project never pauses for
// inactivity. Vercel sends "Authorization: Bearer $CRON_SECRET".
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient<Database>(supabaseUrl(), supabaseKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("keep_alive")
    .update({ pinged_at: new Date().toISOString() })
    .eq("id", 1)
    .select("pinged_at")
    .single();

  if (error) {
    console.error("Keep-alive query failed", error);
    return Response.json({ error: "Database query failed" }, { status: 500 });
  }

  return Response.json({ ok: true, pingedAt: data.pinged_at });
}
