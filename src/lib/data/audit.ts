import "server-only";
import { auditHref, auditRefTable, type AuditAction, type AuditKind, type AuditRefTable } from "@/lib/domain/audit";
import { createClient } from "@/lib/supabase/server";

export type AuditEntry = {
  id: number;
  createdAt: string;
  /** Null when the author's Player was deleted. */
  actorName: string | null;
  action: AuditAction;
  kind: AuditKind;
  label: string;
  /** Null when the row it points to no longer exists. */
  href: string | null;
};

export type AuditPage = { entries: AuditEntry[]; page: number; pageCount: number };

/** One page (1-based) of the Audit log, newest first; past the last page it is empty. Only the Admin reads it (RLS). */
export async function listAuditEntries(filter: { kind: AuditKind | null; actorId: string | null }, page: number, size: number): Promise<AuditPage> {
  const supabase = await createClient();
  let query = supabase
    .from("audit_entries")
    .select("id, created_at, action, kind, ref_id, label, players(display_name)", { count: "exact" })
    .order("id", { ascending: false });
  if (filter.kind) query = query.eq("kind", filter.kind);
  if (filter.actorId) query = query.eq("actor_id", filter.actorId);

  const { data, count } = await query.range((page - 1) * size, page * size - 1);
  const rows = data ?? [];

  // An entry links to its page only while the row is still there.
  const refsByTable = new Map<AuditRefTable, Set<string>>();
  for (const r of rows) {
    const table = auditRefTable(r.kind);
    if (table && r.ref_id) refsByTable.set(table, (refsByTable.get(table) ?? new Set()).add(r.ref_id));
  }
  const existing = new Set<string>();
  await Promise.all(
    [...refsByTable].map(async ([table, ids]) => {
      const { data: found } = await supabase.from(table).select("id").in("id", [...ids]);
      for (const f of found ?? []) existing.add(f.id);
    }),
  );

  return {
    page,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / size)),
    entries: rows.map((r) => {
      const linked = auditRefTable(r.kind) === null || (r.ref_id !== null && existing.has(r.ref_id));
      return {
        id: r.id,
        createdAt: r.created_at,
        actorName: r.players?.display_name ?? null,
        action: r.action,
        kind: r.kind,
        label: r.label,
        href: linked ? auditHref(r.kind, r.ref_id) : null,
      };
    }),
  };
}
