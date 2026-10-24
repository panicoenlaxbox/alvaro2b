import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { listCatalogGames } from "@/lib/data/explore";
import { listSessions } from "@/lib/data/sessions";
import { filterGames, parseFilters } from "@/lib/domain/explore";
import { formatSessionDate, groupSessions, todayIso } from "@/lib/domain/session";
import { AutoSubmitForm } from "@/components/auto-submit-form";
import { ChoiceGroup, MINUTE_CHOICES, MODE_CHOICES, PLAYER_CHOICES } from "@/components/game-choices";
import { Faces } from "@/components/owners";
import { SessionCard } from "@/components/session-card";
import { SurpriseMe } from "@/components/surprise-me";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const member = await requireMember();
  const today = todayIso();
  const [sessions, games, params] = await Promise.all([listSessions(), listCatalogGames(), searchParams]);
  const groups = groupSessions(sessions, today);
  // Only the three quick questions apply here; the rest of the filters live in the Catalog.
  const { filters } = parseFilters(params);
  const fits = filterGames(games, { players: filters.players, maxMinutes: filters.maxMinutes, mode: filters.mode });
  const next = groups.upcoming[0];
  const lastPast = groups.past[0];

  return (
    <div className="space-y-8">
      {next && (
        <Link
          href={`/sessions/${next.id}`}
          className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-2xl border-[3px] border-accent bg-card px-4 py-3 shadow-hard transition-transform hover:-translate-y-0.5"
        >
          <span className="font-display text-sm text-accent">Próxima sesión</span>
          <span className="font-medium first-letter:uppercase">
            {next.name ? `${next.name} · ` : ""}
            {formatSessionDate(next.date)}
            {next.time ? `, ${next.time}` : ""}
            {next.place ? ` · ${next.place}` : ""}
          </span>
          <span className="flex items-center gap-2 font-bold sm:ml-auto">
            <Faces people={next.attendees} prefix="Con" />→
          </span>
        </Link>
      )}

      <section className="space-y-3">
        <p className="font-display text-lg text-soft">¡Hola, {member.displayName.split(" ")[0]}!</p>
        <h1 className="text-[2.75rem] sm:text-6xl">¿A qué jugamos hoy?</h1>
      </section>

      {games.length > 0 ? (
        <AutoSubmitForm key={JSON.stringify(params)} action="/" className="card space-y-5 p-4 sm:p-6" aria-label="A qué jugamos">
          <div className="flex flex-wrap gap-x-10 gap-y-5">
            <ChoiceGroup legend="¿Cuántos somos?" name="players" current={filters.players?.toString() ?? ""} options={PLAYER_CHOICES} />
            <ChoiceGroup legend="¿Cuánto tiempo tenemos?" name="minutes" current={filters.maxMinutes?.toString() ?? ""} options={MINUTE_CHOICES} />
            <ChoiceGroup legend="¿Juntos o a muerte?" name="mode" current={filters.mode ?? ""} options={MODE_CHOICES} />
          </div>
          <div className="pt-2">
            {fits.length > 0 ? (
              <SurpriseMe key={fits.map((g) => g.id).join()} games={fits.map((g) => ({ id: g.id, name: g.name }))} />
            ) : (
              <p className="text-soft">Ningún juego encaja con todo eso.</p>
            )}
          </div>
        </AutoSubmitForm>
      ) : (
        <div className="card space-y-4 p-6 text-center sm:p-8">
          <p className="text-lg text-soft">La estantería está vacía.</p>
          <Link href="/games/new" className="btn-primary">
            Añadir juego
          </Link>
        </div>
      )}

      {lastPast && (
        <section className="space-y-3">
          <h2 className="text-lg">Última sesión</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SessionCard session={lastPast} />
          </div>
        </section>
      )}
    </div>
  );
}
