import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { listCatalogGames } from "@/lib/data/explore";
import { listMembers } from "@/lib/data/players";
import { filterGames, parseFilters, SORT_LABELS, SORTS, sortGames } from "@/lib/domain/explore";
import { durationText, PLAY_MODE_LABELS, PLAY_MODES, playersText } from "@/lib/domain/game-form";
import { formatSessionDate, formatShortDate, todayIso } from "@/lib/domain/session";
import { coverUrl, signedUrls } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "@/components/cover";
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{showRetired ? "Juegos retirados" : "Juegos"}</h1>
        <Link href="/games/new" className="btn-primary">
          Añadir
        </Link>
      </div>

      {session && (
        <p className="card border-accent text-sm first-letter:uppercase">
          Para la sesión del {formatSessionDate(session.date)}: {attendeeIds.length} asistentes.{" "}
          <Link href={`/sessions/${session.id}`} className="underline">
            Volver a la sesión
          </Link>
        </p>
      )}

      {!showRetired && (
        <details className="card" open={activeFilters > 0 && !session}>
          <summary className="cursor-pointer font-semibold">Filtros{activeFilters ? ` (${activeFilters})` : ""}</summary>
          <form method="get" className="mt-3 space-y-3">
            {session && <input type="hidden" name="session" value={session.id} />}
            <input name="q" defaultValue={filters.query ?? ""} placeholder="Buscar por nombre" aria-label="Buscar por nombre" className="input" />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm">
                <span className="label">Jugadores</span>
                <input name="players" type="number" min={1} defaultValue={filters.players ?? ""} className="input" />
              </label>
              <label className="text-sm">
                <span className="label">Tenemos (min)</span>
                <input name="minutes" type="number" min={1} defaultValue={filters.maxMinutes ?? ""} className="input" />
              </label>
              <label className="text-sm">
                <span className="label">Complejidad mín.</span>
                <input name="cmin" type="number" step="0.1" min={1} max={5} defaultValue={filters.minComplexity ?? ""} className="input" />
              </label>
              <label className="text-sm">
                <span className="label">Complejidad máx.</span>
                <input name="cmax" type="number" step="0.1" min={1} max={5} defaultValue={filters.maxComplexity ?? ""} className="input" />
              </label>
              <label className="text-sm">
                <span className="label">Modo</span>
                <select name="mode" defaultValue={filters.mode ?? ""} className="input">
                  <option value="">Cualquiera</option>
                  {PLAY_MODES.map((m) => (
                    <option key={m} value={m}>
                      {PLAY_MODE_LABELS[m]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="label">Valoración media ≥</span>
                <input name="rating" type="number" step="0.5" min={1} max={5} defaultValue={filters.minRating ?? ""} className="input" />
              </label>
              <label className="text-sm">
                <span className="label">Sin jugar desde (días)</span>
                <input name="since" type="number" min={1} defaultValue={filters.notPlayedForDays ?? ""} className="input" />
              </label>
              <label className="text-sm">
                <span className="label">Ordenar por</span>
                <select name="sort" defaultValue={sort} className="input">
                  {SORTS.map((s) => (
                    <option key={s} value={s}>
                      {SORT_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <fieldset>
              <legend className="label">Dueño</legend>
              <div className="flex flex-wrap gap-2">
                {session ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="owners_coming" value="1" defaultChecked={params.owners_coming === "1"} className="size-4" />
                    Solo juegos cuyo dueño viene
                  </label>
                ) : (
                  members.map((m) => (
                    <label key={m.id} className="cursor-pointer">
                      <input type="checkbox" name="owner" value={m.id} defaultChecked={filters.ownerIds?.includes(m.id)} className="peer sr-only" />
                      <span className="chip px-3 py-1.5 text-sm peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground">
                        {m.display_name}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="never" value="1" defaultChecked={filters.neverPlayed} className="size-4" /> Nunca jugados
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="liked" value="1" defaultChecked={filters.iLikeIt} className="size-4" /> A mí me gustan
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">
                Aplicar
              </button>
              <Link href={session ? `/games?session=${session.id}` : "/games"} className="btn-secondary">
                Limpiar
              </Link>
            </div>
          </form>
        </details>
      )}

      {!showRetired && results.length > 0 && <SurpriseMe games={results.map((g) => ({ id: g.id, name: g.name }))} />}

      <p className="text-sm text-muted">
        {results.length} {results.length === 1 ? "juego" : "juegos"}
      </p>

      <ul className="space-y-2">
        {results.map((g) => {
          const details = [playersText(g.minPlayers, g.maxPlayers), durationText(g.minDuration, g.maxDuration), g.ownerName].filter(Boolean);
          return (
            <li key={g.id}>
              <Link href={`/games/${g.id}`} className="card flex items-center gap-3 p-3">
                <Cover url={coverUrl({ cover_path: g.coverPath, bgg_image_url: g.bggImageUrl }, signed)} name={g.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{g.name}</p>
                  <p className="truncate text-sm text-muted">{details.join(" · ") || "Sin datos"}</p>
                  <p className="text-xs text-muted">
                    {g.playCount === 0 ? "Nunca jugado" : `${g.playCount} ${g.playCount === 1 ? "partida" : "partidas"} · última el ${formatShortDate(g.lastPlayed!)}`}
                  </p>
                </div>
                {g.averageRating !== null && <span className="text-sm font-medium text-accent">★ {g.averageRating.toLocaleString("es-ES")}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      {results.length === 0 && <p className="text-muted">{showRetired ? "No hay juegos retirados." : "Ningún juego cumple los filtros."}</p>}

      <Link href={showRetired ? "/games" : "/games?retired=1"} className="block text-center text-sm text-muted underline">
        {showRetired ? "Volver al catálogo" : "Ver juegos retirados"}
      </Link>
    </div>
  );
}
