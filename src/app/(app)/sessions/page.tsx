import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { listSessions } from "@/lib/data/sessions";
import { paginate, parsePage } from "@/lib/domain/paginate";
import { groupSessions, todayIso } from "@/lib/domain/session";
import { SessionCard } from "@/components/session-card";

export const metadata: Metadata = { title: "Sesiones" };

const PAST_PAGE_SIZE = 10;

export default async function SessionsPage({ searchParams }: PageProps<"/sessions">) {
  await requireMember();
  const groups = groupSessions(await listSessions(), todayIso());
  const { page } = await searchParams;
  const past = paginate(groups.past, parsePage(page), PAST_PAGE_SIZE);
  // Past starts collapsed; a page link keeps it open.
  const pageHref = (n: number) => `/sessions?page=${n}#past`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl sm:text-4xl">Sesiones</h1>
        <Link href="/sessions/new" className="btn-primary">
          Añadir
        </Link>
      </div>

      <details open>
        <summary className="cursor-pointer">
          <h2 className="inline">Próximas ({groups.upcoming.length})</h2>
        </summary>
        {groups.upcoming.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {groups.upcoming.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </details>

      <details id="past" open={page !== undefined} className="scroll-mt-20">
        <summary className="cursor-pointer">
          <h2 className="inline">Pasadas ({groups.past.length})</h2>
        </summary>
        {past.items.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {past.items.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
        {past.pageCount > 1 && (
          <nav aria-label="Páginas de sesiones pasadas" className="mt-3 flex items-center justify-between gap-2 pt-2">
            {past.page > 1 ? (
              <Link href={pageHref(past.page - 1)} className="btn-secondary">
                ← Más recientes
              </Link>
            ) : (
              <span />
            )}
            <span className="text-sm text-muted">
              Página {past.page} de {past.pageCount}
            </span>
            {past.page < past.pageCount ? (
              <Link href={pageHref(past.page + 1)} className="btn-secondary">
                Más antiguas →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </details>

    </div>
  );
}
