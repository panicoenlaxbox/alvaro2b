import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { listCatalogGames } from "@/lib/data/explore";
import { listSessions } from "@/lib/data/sessions";
import { filterGames, parseFilters } from "@/lib/domain/explore";
import { formatSessionDate, groupSessions, todayIso } from "@/lib/domain/session";
import { AutoSubmitForm } from "@/components/auto-submit-form";
import { ChoiceGroup, MINUTE_CHOICES, MODE_CHOICES, PLAYER_CHOICES } from "@/components/game-choices";
import { SessionCard } from "@/components/session-card";
import { SurpriseMe } from "@/components/surprise-me";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const member = await requireMember();
  const today = todayIso();
  const [sessions, games, params] = await Promise.all([listSessions(), listCatalogGames(member.playerId), searchParams]);
  const groups = groupSessions(sessions, today);
  // Only the three quick questions apply here; the rest of the filters live in the Catalog.
  const { filters } = parseFilters(params);
  const fits = filterGames(games, { players: filters.players, maxMinutes: filters.maxMinutes, mode: filters.mode }, today);
  const [next, ...later] = groups.upcoming;
  const lastPast = groups.past[0];

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
        <Link href="/sessions/new" className="btn-primary shrink-0">
          Añadir
        </Link>
      </section>

      <AutoSubmitForm key={JSON.stringify(params)} action="/" className="card space-y-5 p-4 sm:p-6" aria-label="A qué jugamos">
        <div className="flex flex-wrap gap-x-10 gap-y-5">
          <ChoiceGroup legend="¿Cuántos somos?" name="players" current={filters.players?.toString() ?? ""} options={PLAYER_CHOICES} />
          <ChoiceGroup legend="¿Cuánto tiempo tenemos?" name="minutes" current={filters.maxMinutes?.toString() ?? ""} options={MINUTE_CHOICES} />
          <ChoiceGroup legend="¿Juntos o a muerte?" name="mode" current={filters.mode ?? ""} options={MODE_CHOICES} />
        </div>
        <div className="border-t-2 border-dashed border-border pt-4">
          {fits.length > 0 ? (
            <SurpriseMe key={fits.map((g) => g.id).join()} games={fits.map((g) => ({ id: g.id, name: g.name }))} />
          ) : (
            <p className="text-soft">Ningún juego encaja con todo eso.</p>
          )}
        </div>
      </AutoSubmitForm>

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
            No hay ninguna.{" "}
            <Link href="/sessions/new" className="font-bold text-accent underline">
              ¿Montamos una?
            </Link>
          </div>
        )}
      </section>

      {lastPast && (
        <section className="space-y-3">
          <h2 className="text-lg">Última sesión</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <SessionCard session={lastPast} />
          </div>
        </section>
      )}
    </div>
  );
}
