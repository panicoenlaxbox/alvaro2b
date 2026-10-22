import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listAuditEntries } from "@/lib/data/audit";
import { listMembers } from "@/lib/data/players";
import { AUDIT_KINDS, AUDIT_KIND_LABELS, describeAuditEntry, formatAuditTime, parseAuditKind } from "@/lib/domain/audit";
import { parsePage } from "@/lib/domain/paginate";
import { AutoSubmitForm } from "@/components/auto-submit-form";

export const metadata: Metadata = { title: "Registro de cambios" };

const PAGE_SIZE = 50;

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requireAdmin();
  const params = await searchParams;
  const members = await listMembers();
  const kind = parseAuditKind(params.kind);
  const memberParam = Array.isArray(params.member) ? params.member[0] : params.member;
  const actorId = members.some((m) => m.id === memberParam) ? memberParam! : null;
  const { entries, page, pageCount } = await listAuditEntries({ kind, actorId }, parsePage(params.page), PAGE_SIZE);

  const pageHref = (n: number) => {
    const query = new URLSearchParams();
    if (kind) query.set("kind", kind);
    if (actorId) query.set("member", actorId);
    query.set("page", String(n));
    return `/admin/audit?${query}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl sm:text-4xl">Registro de cambios</h1>

      <AutoSubmitForm key={JSON.stringify(params)} action="/admin/audit" className="card grid grid-cols-2 gap-3" aria-label="Filtros">
        <label>
          <span className="label">Qué</span>
          <select name="kind" defaultValue={kind ?? ""} className="input">
            <option value="">Todo</option>
            {AUDIT_KINDS.map((k) => (
              <option key={k} value={k}>
                {AUDIT_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Quién</span>
          <select name="member" defaultValue={actorId ?? ""} className="input">
            <option value="">Todos</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
              </option>
            ))}
          </select>
        </label>
      </AutoSubmitForm>

      {entries.length > 0 ? (
        <ul className="card divide-y divide-border p-0">
          {entries.map((e) => (
            <li key={e.id} className="space-y-0.5 px-4 py-3">
              <p>
                <span className="font-semibold">{e.actorName ?? "Alguien"}</span> {describeAuditEntry(e.action, e.kind)}{" "}
                {e.href ? (
                  <Link href={e.href} className="underline">
                    {e.label}
                  </Link>
                ) : (
                  <span>{e.label}</span>
                )}
              </p>
              <p className="text-sm text-muted">{formatAuditTime(e.createdAt)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-soft">No hay cambios registrados.</p>
      )}

      {pageCount > 1 && (
        <nav aria-label="Páginas del registro" className="flex items-center justify-between gap-2">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="btn-secondary">
              ← Más recientes
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted">
            Página {page} de {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={pageHref(page + 1)} className="btn-secondary">
              Más antiguos →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
