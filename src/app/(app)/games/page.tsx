import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { listCatalogGames } from "@/lib/data/explore";
import { listMembers } from "@/lib/data/players";
import { filterGames, parseFilters, SORT_LABELS, SORTS, sortGames } from "@/lib/domain/explore";
import { durationText, PLAY_MODE_LABELS, PLAY_MODES, playersText, type PlayMode } from "@/lib/domain/game-form";
import { formatSessionDate, formatShortDate, todayIso } from "@/lib/domain/session";
import { coverUrl, signedUrls } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { AutoSubmitForm } from "@/components/auto-submit-form";
import { tint } from "@/components/tint";
import { SurpriseMe } from "./surprise-me";

export const metadata: Metadata = { title: "Juegos" };

export default async function GamesPage({ searchParams }: PageProps<"/games">) {
  const member = await requireMember();
  const params = await searchParams;
  const sessionId = typeof params.session === "string" ? params.session : null;
  const showRetired = params.retired === "1";
  const supabase = await createClient();

  const [games, members, { data: session }] = await Promise.all([
    listCatalogGames(member.playerId),
    listMembers(),
    sessionId
      ? supabase.from("sessions").select("id, date, status, session_attendees(player_id)").eq("id", sessionId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // With a planned Session, filters start from its Attendees (PRD 3).
  const attendeeIds = session?.session_attendees.map((a) => a.player_id) ?? [];
  const { filters, sort } = parseFilters(params);
  if (session && params.players === undefined && attendeeIds.length) filters.players = attendeeIds.length;
  if (session && params.owners_coming === "1") filters.ownerIds = attendeeIds;

  const today = todayIso();
  const results = showRetired
    ? sortGames(games.filter((g) => g.retired), "name")
    : sortGames(filterGames(games, filters, today), sort);
  const signed = await signedUrls(results.map((g) => g.coverPath));
  const activeFilters = Object.values(filters).filter((v) => v !== undefined).length;
  const moreFilters = [
    filters.query,
    filters.minComplexity,
    filters.maxComplexity,
    filters.minRating,
    filters.notPlayedForDays,
    filters.neverPlayed,
    filters.iLikeIt,
    filters.ownerIds,
  ].filter((v) => v !== undefined).length;
  const clearHref = session ? `/games?session=${session.id}&players=` : "/games";

  return (
    <div className="space-y-6">
      {session && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border-[3px] border-ink bg-teal px-4 py-3 text-ink shadow-hard">
          <span className="font-display text-sm">Para la sesión</span>
          <span className="font-medium first-letter:uppercase">
            {formatSessionDate(session.date)}: {attendeeIds.length} asistentes
          </span>
          <Link href={`/sessions/${session.id}`} className="font-bold underline sm:ml-auto">
            Volver a la sesión
          </Link>
        </p>
      )}

      <section className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="text-4xl sm:text-5xl">{showRetired ? "Juegos retirados" : "¿A qué jugamos?"}</h1>
          {!showRetired && <p className="text-soft">Decid cuántos sois y cuánto tiempo tenéis. El resto lo filtra la mesa… o el dado.</p>}
        </div>
        <Link href="/games/new" className="btn-primary shrink-0">
          <span>
            + Añadir<span className="hidden sm:inline"> juego</span>
          </span>
        </Link>
      </section>

      {!showRetired && results.length > 0 && (
        <SurpriseMe key={results.map((g) => g.id).join()} games={results.map((g) => ({ id: g.id, name: g.name }))} autoStart={params.dado === "1"} />
      )}

      {!showRetired && (
        <AutoSubmitForm key={JSON.stringify(params)} action="/games" className="card space-y-5 p-4 sm:p-6" aria-label="Filtros">
          {session && <input type="hidden" name="session" value={session.id} />}
          <div className="flex flex-wrap gap-x-10 gap-y-5">
            <ChoiceGroup legend="¿Cuántos somos?" name="players" current={filters.players?.toString() ?? ""} options={PLAYER_CHOICES} />
            <ChoiceGroup legend="¿Cuánto tiempo tenemos?" name="minutes" current={filters.maxMinutes?.toString() ?? ""} options={MINUTE_CHOICES} />
            <ChoiceGroup legend="¿Juntos o a muerte?" name="mode" current={filters.mode ?? ""} options={MODE_CHOICES} />
          </div>

          <details className="group" open={moreFilters > 0}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-display text-sm text-muted">
              <span aria-hidden className="transition-transform group-open:rotate-90">
                ▸
              </span>
              Más filtros{moreFilters ? ` (${moreFilters})` : ""}
            </summary>
            <div className="mt-3 space-y-4">
              <input name="q" defaultValue={filters.query ?? ""} placeholder="Buscar por nombre" aria-label="Buscar por nombre" className="input" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <label>
                  <span className="label">Complejidad mín.</span>
                  <input name="cmin" type="number" step="0.1" min={1} max={5} defaultValue={filters.minComplexity ?? ""} className="input" />
                </label>
                <label>
                  <span className="label">Complejidad máx.</span>
                  <input name="cmax" type="number" step="0.1" min={1} max={5} defaultValue={filters.maxComplexity ?? ""} className="input" />
                </label>
                <label>
                  <span className="label">Valoración ≥</span>
                  <input name="rating" type="number" step="0.5" min={1} max={5} defaultValue={filters.minRating ?? ""} className="input" />
                </label>
                <label>
                  <span className="label">Sin jugar (días)</span>
                  <input name="since" type="number" min={1} defaultValue={filters.notPlayedForDays ?? ""} className="input" />
                </label>
              </div>
              <fieldset>
                <legend className="label">Dueño</legend>
                <div className="flex flex-wrap gap-2">
                  {session ? (
                    <Check name="owners_coming" checked={params.owners_coming === "1"}>
                      Solo juegos cuyo dueño viene
                    </Check>
                  ) : (
                    members.map((m) => (
                      <label key={m.id}>
                        <input type="checkbox" name="owner" value={m.id} defaultChecked={filters.ownerIds?.includes(m.id)} className="peer sr-only" />
                        <span className={CHIP}>{m.display_name}</span>
                      </label>
                    ))
                  )}
                </div>
              </fieldset>
              <div className="flex flex-wrap gap-2">
                <Check name="never" checked={filters.neverPlayed}>
                  Nunca jugados
                </Check>
                <Check name="liked" checked={filters.iLikeIt}>
                  A mí me gustan
                </Check>
              </div>
              <button type="submit" className="btn-primary">
                Aplicar
              </button>
            </div>
          </details>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-border pt-4">
            <p className="text-lg">
              <strong className="font-display text-2xl text-accent">{results.length}</strong> {results.length === 1 ? "juego encaja" : "juegos encajan"}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-muted">
                Orden
                <select name="sort" defaultValue={sort} className="input w-auto py-1.5">
                  {SORTS.map((s) => (
                    <option key={s} value={s}>
                      {SORT_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              {activeFilters > 0 && (
                <Link href={clearHref} scroll={false} className="flex min-h-11 items-center text-sm text-muted underline">
                  Quitar filtros
                </Link>
              )}
            </div>
          </div>
        </AutoSubmitForm>
      )}

      {results.length > 0 ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((g) => (
            <li key={g.id}>
              <GameCard
                game={g}
                cover={coverUrl({ cover_path: g.coverPath, bgg_image_url: g.bggImageUrl }, signed)}
                details={[playersText(g.minPlayers, g.maxPlayers), durationText(g.minDuration, g.maxDuration)].filter(Boolean).join(" · ")}
                owner={g.ownerName}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border-[3px] border-dashed border-border p-8 text-center text-lg text-soft">
          {showRetired ? "No hay juegos retirados." : "Ningún juego cumple todo eso. Quitad algún filtro… o comprad uno nuevo."}
        </p>
      )}

      <Link href={showRetired ? "/games" : "/games?retired=1"} className="block text-center text-sm text-muted underline">
        {showRetired ? "Volver al catálogo" : "Ver juegos retirados"}
      </Link>
    </div>
  );
}

const CHIP = "toggle peer-checked:border-accent peer-checked:bg-accent peer-checked:text-ink peer-focus-visible:outline-3 peer-focus-visible:outline-accent";

const PLAYER_CHOICES = [{ value: "", label: "Todos" }, ...[2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: String(n), label: String(n) }))];
const MINUTE_CHOICES = [
  { value: "", label: "Me da igual" },
  { value: "30", label: "Media hora" },
  { value: "60", label: "1 h" },
  { value: "120", label: "2 h" },
];
const MODE_CHOICES = [{ value: "", label: "Me da igual" }, ...PLAY_MODES.map((m) => ({ value: m, label: PLAY_MODE_LABELS[m] }))];

/** Radio chips over one GET parameter. A value set some other way (a Session's Attendees) gets its own chip. */
function ChoiceGroup({ legend, name, current, options }: { legend: string; name: string; current: string; options: { value: string; label: string }[] }) {
  const shown = options.some((o) => o.value === current) ? options : [...options, { value: current, label: name === "minutes" ? `${current} min` : current }];
  return (
    <fieldset className="min-w-0 space-y-2 max-sm:w-full">
      <legend className="label">{legend}</legend>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pt-0.5 pb-1.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {shown.map((o) => (
          <label key={o.value} className="relative shrink-0">
            <input type="radio" name={name} value={o.value} defaultChecked={o.value === current} className="peer sr-only" />
            <span className={`${CHIP} ${/^\d+$/.test(o.label) ? "min-w-12 font-display text-lg" : ""}`}>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Check({ name, checked, children }: { name: string; checked?: boolean; children: React.ReactNode }) {
  return (
    <label>
      <input type="checkbox" name={name} value="1" defaultChecked={checked} className="peer sr-only" />
      <span className={CHIP}>{children}</span>
    </label>
  );
}

const MODE_TAG: Record<PlayMode, { label: string; className: string }> = {
  competitive: { label: "Versus", className: "text-coral" },
  cooperative: { label: "Coop", className: "text-teal" },
  team: { label: "Equipos", className: "text-blue" },
};

/* eslint-disable @next/next/no-img-element -- covers are signed or external URLs that change hourly */
function GameCard({
  game,
  cover,
  details,
  owner,
}: {
  game: { id: string; name: string; mode: PlayMode; playCount: number; lastPlayed: string | null; averageRating: number | null };
  cover: string | null;
  details: string;
  owner: string | null;
}) {
  const tag = MODE_TAG[game.mode];
  return (
    <Link
      href={`/games/${game.id}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border-[3px] border-ink bg-card shadow-hard-lg transition-transform hover:-translate-y-1"
    >
      <div className="relative flex h-32 items-center justify-center border-b-[3px] border-ink" style={{ background: tint(game.name) }}>
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span aria-hidden className="font-display text-5xl text-paper [text-shadow:3px_3px_0_var(--ink)]">
            {game.name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 3).toUpperCase()}
          </span>
        )}
        <span className={`absolute top-2.5 left-2.5 rounded-md bg-ink px-2.5 py-0.5 font-display text-xs ${tag.className}`}>{tag.label}</span>
        {game.averageRating !== null && (
          <span className="absolute top-2.5 right-2.5 rounded-md bg-ink px-2 py-0.5 text-sm font-bold text-accent">
            ★ {game.averageRating.toLocaleString("es-ES")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="font-sans text-lg leading-snug font-bold">{game.name}</h2>
        {details && <p className="text-soft">{details}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1 text-sm text-muted">
          <span>{owner ? `De ${owner}` : "Sin dueño"}</span>
          <span>
            {game.playCount === 0 ? "Nunca jugado" : `${game.playCount} ${game.playCount === 1 ? "partida" : "partidas"} · ${formatShortDate(game.lastPlayed!)}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
