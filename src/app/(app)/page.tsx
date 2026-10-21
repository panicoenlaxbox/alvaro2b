import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { listSessions } from "@/lib/data/sessions";
import { formatSessionDate, groupSessions, todayIso } from "@/lib/domain/session";
import { DiceIcon } from "@/components/dice-icon";
import { SessionCard } from "@/components/session-card";

export default async function HomePage() {
  const member = await requireMember();
  const groups = groupSessions(await listSessions(), todayIso());
  const [next, ...later] = groups.upcoming;
  const lastHeld = groups.held[0];

  return (
    <div className="space-y-8">
      {next && (
        <Link
          href={`/sessions/${next.id}`}
          className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-2xl border-[3px] border-ink bg-teal px-4 py-3 text-ink shadow-hard transition-transform hover:-translate-y-0.5"
        >
          <span className="font-display text-sm">Próxima sesión</span>
          <span className="font-medium first-letter:uppercase">
            {next.name ? `${next.name} · ` : ""}
            {formatSessionDate(next.date)}
            {next.place ? ` · ${next.place}` : ""}
          </span>
          <span className="font-bold sm:ml-auto">
            {next.attendeeCount ? `${next.attendeeCount} ${next.attendeeCount === 1 ? "asistente" : "asistentes"} →` : "Ver sesión →"}
          </span>
        </Link>
      )}

      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl space-y-3">
          <p className="font-display text-lg text-soft">¡Hola, {member.displayName.split(" ")[0]}!</p>
          <h1 className="text-[2.75rem] sm:text-6xl">¿A qué jugamos hoy?</h1>
          <p className="text-lg text-soft">Cuántos somos, cuánto tiempo tenemos… y el resto lo decide el catálogo. O el dado.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto">
          <Link href="/games?roll=1" className="btn-hot min-h-16 px-7 text-xl shadow-hard-lg">
            <DiceIcon className="size-7" />
            ¡Tira el dado!
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/games" className="btn-secondary">
              Elegir juego
            </Link>
            <Link href="/sessions/new" className="btn-primary">
              Nueva sesión
            </Link>
          </div>
        </div>
      </section>

      {groups.pendingClose.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg text-danger">Pendientes de cerrar</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.pendingClose.map((s) => (
              <SessionCard key={s.id} session={s} pendingClose />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg">Próximas sesiones</h2>
        {groups.upcoming.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[next!, ...later].slice(0, 4).map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-[3px] border-dashed border-border p-6 text-center text-soft">
            No hay ninguna planificada.{" "}
            <Link href="/sessions/new" className="font-bold text-accent underline">
              ¿Montamos una?
            </Link>
          </div>
        )}
      </section>

      {lastHeld && (
        <section className="space-y-3">
          <h2 className="text-lg">Última sesión</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <SessionCard session={lastHeld} />
          </div>
        </section>
      )}
    </div>
  );
}
