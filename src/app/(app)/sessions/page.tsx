import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { listSessions } from "@/lib/data/sessions";
import { groupSessions, todayIso } from "@/lib/domain/session";
import { SessionCard } from "@/components/session-card";

export const metadata: Metadata = { title: "Sesiones" };

export default async function SessionsPage() {
  await requireMember();
  const groups = groupSessions(await listSessions(), todayIso());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Sesiones</h1>
        <Link href="/sessions/new" className="btn-primary">
          Nueva sesión
        </Link>
      </div>

      {groups.pendingClose.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-accent">Pendientes de cerrar</h2>
          <p className="text-sm text-muted">Ya pasó la fecha: registra lo que se jugó o cancélala.</p>
          {groups.pendingClose.map((s) => (
            <SessionCard key={s.id} session={s} pendingClose />
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">Próximas</h2>
        {groups.upcoming.length ? groups.upcoming.map((s) => <SessionCard key={s.id} session={s} />) : <p className="text-sm text-muted">No hay ninguna planificada.</p>}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Celebradas</h2>
        {groups.held.length ? groups.held.map((s) => <SessionCard key={s.id} session={s} />) : <p className="text-sm text-muted">Aún no hay ninguna.</p>}
      </section>

      {groups.cancelled.length > 0 && (
        <details className="space-y-2">
          <summary className="cursor-pointer font-semibold text-muted">Canceladas ({groups.cancelled.length})</summary>
          <div className="mt-2 space-y-2">
            {groups.cancelled.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
