import "server-only";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Table = keyof Database["public"]["Tables"];

/** Every table with group data, in an order that respects foreign keys for a restore. */
export const EXPORT_TABLES = [
  "players",
  "allowed_emails",
  "games",
  "expansions",
  "ratings",
  "sessions",
  "session_attendees",
  "rsvps",
  "plays",
  "teams",
  "participants",
  "play_expansions",
  "polls",
  "candidates",
  "approvals",
  "vetoes",
  "photos",
  "photo_tags",
] as const satisfies readonly Table[];

const PAGE = 1000;

/** Reads a whole table under the caller's RLS, page by page (the API returns at most 1000 rows). */
async function readAll(table: Table): Promise<unknown[]> {
  const supabase = await createClient();
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + PAGE - 1);
    if (error) throw new Error(`Export of ${table} failed: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

export async function exportAll(): Promise<Record<string, unknown>> {
  const tables: Record<string, unknown[]> = {};
  for (const table of EXPORT_TABLES) tables[table] = await readAll(table);
  return { app: "alvaro2b", exportedAt: new Date().toISOString(), tables };
}
