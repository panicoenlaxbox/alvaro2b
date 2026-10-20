import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { listSessions } from "@/lib/data/sessions";
import { groupSessions, todayIso } from "@/lib/domain/session";
import { SessionCard } from "@/components/session-card";

export default async function HomePage() {
  const member = await requireMember();
  const groups = groupSessions(await listSessions(), todayIso());
  const lastHeld = groups.held[0];

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold">¡Hola, {member.displayName.split(" ")[0]}!</h1>
        <p className="text-muted">¿A qué jugamos hoy?</p>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Link href="/sessions/new" className="btn-primary py-4">
          Nueva sesión
        </Link>
        <Link href="/games" className="btn-secondary py-4">
          Elegir juego
        </Link>
      </section>

      {groups.pendingClose.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-accent">Pendientes de cerrar</h2>
          {groups.pendingClose.map((s) => (
            <SessionCard key={s.id} session={s} pendingClose />
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">Próximas sesiones</h2>
        {groups.upcoming.length ? (
          groups.upcoming.slice(0, 3).map((s) => <SessionCard key={s.id} session={s} />)
        ) : (
          <p className="text-sm text-muted">No hay ninguna planificada.</p>
        )}
      </section>

      {lastHeld && (
        <section className="space-y-2">
          <h2 className="font-semibold">Última sesión</h2>
          <SessionCard session={lastHeld} />
        </section>
      )}
    </div>
  );
}
