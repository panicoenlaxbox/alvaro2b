import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { listSessions } from "@/lib/data/sessions";
import { paginate, parsePage } from "@/lib/domain/paginate";
import { groupSessions, todayIso } from "@/lib/domain/session";
import { SessionCard } from "@/components/session-card";

export const metadata: Metadata = { title: "Sesiones" };

const HELD_PAGE_SIZE = 10;

export default async function SessionsPage({ searchParams }: PageProps<"/sessions">) {
  await requireMember();
  const groups = groupSessions(await listSessions(), todayIso());
  const { page } = await searchParams;
  const held = paginate(groups.held, parsePage(page), HELD_PAGE_SIZE);
  // Held starts collapsed; a page link keeps it open.
  const pageHref = (n: number) => `/sessions?page=${n}#held`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl sm:text-4xl">Sesiones</h1>
        <Link href="/sessions/new" className="btn-primary">
          Añadir
        </Link>
      </div>

      {groups.pendingClose.length > 0 && (
        <details open>
          <summary className="cursor-pointer text-danger">
            <h2 className="inline">Pendientes de cerrar ({groups.pendingClose.length})</h2>
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {groups.pendingClose.map((s) => (
              <SessionCard key={s.id} session={s} pendingClose />
            ))}
          </div>
        </details>
      )}

      <details open>
        <summary className="cursor-pointer">
          <h2 className="inline">Próximas ({groups.upcoming.length})</h2>
        </summary>
        {groups.upcoming.length ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {groups.upcoming.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">No hay ninguna planificada.</p>
        )}
      </details>

      <details id="held" open={page !== undefined} className="scroll-mt-20">
        <summary className="cursor-pointer">
          <h2 className="inline">Celebradas ({groups.held.length})</h2>
        </summary>
        {held.items.length ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {held.items.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Aún no hay ninguna.</p>
        )}
        {held.pageCount > 1 && (
          <nav aria-label="Páginas de sesiones celebradas" className="mt-3 flex items-center justify-between gap-2 pt-2">
            {held.page > 1 ? (
              <Link href={pageHref(held.page - 1)} className="btn-secondary">
                ← Más recientes
              </Link>
            ) : (
              <span />
            )}
            <span className="text-sm text-muted">
              Página {held.page} de {held.pageCount}
            </span>
            {held.page < held.pageCount ? (
              <Link href={pageHref(held.page + 1)} className="btn-secondary">
                Más antiguas →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </details>

      {groups.cancelled.length > 0 && (
        <details>
          <summary className="cursor-pointer">
            <h2 className="inline">Canceladas ({groups.cancelled.length})</h2>
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {groups.cancelled.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
