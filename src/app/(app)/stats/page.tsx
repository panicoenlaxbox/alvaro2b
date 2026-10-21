import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { FilterForm } from "@/components/auto-submit-form";
import { Avatar } from "@/components/avatar";
import { Dropdown } from "@/components/dropdown";
import { loadStatsData } from "@/lib/data/stats";
import { formatDuration } from "@/lib/domain/play";
import { formatShortDate } from "@/lib/domain/session";
import { gameStats, groupStats, parseRange, playerStats, type DateRange } from "@/lib/domain/stats";
import { RankingRow, type RankingItem } from "./ranking-row";

export const metadata: Metadata = { title: "Estadísticas" };

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-3">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

type RankingEntry = { name: string; count: number; href?: string; avatarUrl?: string | null; items?: RankingItem[] };

/** Players get their avatar next to the name; pass `avatarUrl` (even null) to show it. */
function Ranking({ title, rows, unit }: { title: string; rows: RankingEntry[]; unit: [string, string] }) {
  return (
    <section className="card space-y-2">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Sin datos.</p>
      ) : (
        <ol className="space-y-1 text-sm">
          {[...rows].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es")).map((r, i) => (
            <RankingRow
              key={r.name + i}
              position={i + 1}
              count={`${r.count} ${r.count === 1 ? unit[0] : unit[1]}`}
              items={r.items ?? []}
              name={
                <>
                  {r.avatarUrl !== undefined && (
                    <span className="mr-2 inline-flex shrink-0">
                      <Avatar name={r.name} url={r.avatarUrl} size={24} />
                    </span>
                  )}
                  {r.href ? (
                    <Link href={r.href} className="truncate underline">
                      {r.name}
                    </Link>
                  ) : (
                    <span className="truncate">{r.name}</span>
                  )}
                </>
              }
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function rangeQuery(range: DateRange, year?: string): string {
  if (year) return `year=${year}`;
  return [range.from && `from=${range.from}`, range.to && `to=${range.to}`].filter(Boolean).join("&");
}

export default async function StatsPage({ searchParams }: PageProps<"/stats">) {
  await requireMember();
  const params = await searchParams;
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);
  const year = one("year");
  const range = parseRange({ year, from: one("from"), to: one("to") });
  const playerId = one("player");
  const gameId = one("game");

  const data = await loadStatsData();
  const playerName = new Map(data.players.map((p) => [p.id, p.name]));
  const gameName = new Map(data.games.map((g) => [g.id, g.name]));
  const years = [...new Set([...data.sessions.map((s) => s.date.slice(0, 4))])].sort().reverse();
  const q = rangeQuery(range, year);
  const withQuery = (...parts: string[]) => {
    const query = parts.filter(Boolean).join("&");
    return query ? `/stats?${query}` : "/stats";
  };
  const withRange = (extra: string) => withQuery(extra, q);

  const player = playerId ? data.players.find((p) => p.id === playerId) : undefined;
  const game = gameId ? data.games.find((g) => g.id === gameId) : undefined;
  // Clears the dates only: the player or game view stays, and "Grupo" leaves it.
  const clearHref = withQuery(player ? `player=${player.id}` : "", game ? `game=${game.id}` : "");

  return (
    <div className="space-y-5">
      <h1 className="text-3xl sm:text-4xl">Estadísticas</h1>

      <FilterForm key={JSON.stringify(params)} action="/stats" className="card grid grid-cols-2 gap-2 sm:grid-cols-4">
        {player && <input type="hidden" name="player" value={player.id} />}
        {game && <input type="hidden" name="game" value={game.id} />}
        <label className="text-sm">
          <span className="label">Año</span>
          <select name="year" defaultValue={year ?? ""} className="input">
            <option value="">Siempre</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="label">Desde</span>
          <input type="date" name="from" defaultValue={year ? "" : (range.from ?? "")} className="input" />
        </label>
        <label className="text-sm">
          <span className="label">Hasta</span>
          <input type="date" name="to" defaultValue={year ? "" : (range.to ?? "")} className="input" />
        </label>
        <div className="flex items-end gap-3">
          <button type="submit" className="btn-primary">
            Filtrar
          </button>
          {q && (
            <Link href={clearHref} scroll={false} className="flex min-h-11 items-center text-sm text-muted underline">
              Quitar filtros
            </Link>
          )}
        </div>
      </FilterForm>

      <nav className="flex flex-wrap gap-2" aria-label="Qué estadísticas ver">
        <Link href={withRange("")} className={!player && !game ? "btn-primary" : "btn-secondary"}>
          Grupo
        </Link>
        <Dropdown group="stats-filter" summaryClassName={player ? "btn-primary" : "btn-secondary"} summary={`${player ? player.name : "Jugador"} ▾`}>
          <ul className="card absolute z-10 mt-1 max-h-64 w-48 space-y-1 overflow-auto p-2">
            {data.players.map((p) => (
              <li key={p.id}>
                <Link href={withRange(`player=${p.id}`)} className="block rounded px-2 py-1 hover:bg-accent-soft">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </Dropdown>
        <Dropdown group="stats-filter" summaryClassName={game ? "btn-primary" : "btn-secondary"} summary={`${game ? game.name : "Juego"} ▾`}>
          <ul className="card absolute z-10 mt-1 max-h-64 w-56 space-y-1 overflow-auto p-2">
            {data.games.map((g) => (
              <li key={g.id}>
                <Link href={withRange(`game=${g.id}`)} className="block rounded px-2 py-1 hover:bg-accent-soft">
                  {g.name}
                </Link>
              </li>
            ))}
          </ul>
        </Dropdown>
      </nav>

      {player ? <PlayerView id={player.id} name={player.name} data={data} range={range} gameName={gameName} playerName={playerName} /> : null}
      {game ? <GameView game={game} data={data} range={range} playerName={playerName} /> : null}
      {!player && !game ? <GroupView data={data} range={range} gameName={gameName} playerName={playerName} withRange={withRange} /> : null}
    </div>
  );
}

function GroupView({
  data,
  range,
  gameName,
  playerName,
  withRange,
}: {
  data: Awaited<ReturnType<typeof loadStatsData>>;
  range: DateRange;
  gameName: Map<string, string>;
  playerName: Map<string, string>;
  withRange: (extra: string) => string;
}) {
  const stats = groupStats(data.sessions, data.plays, data.games, range);
  const avatarUrl = new Map(data.players.map((p) => [p.id, p.avatarUrl]));
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Sesiones" value={stats.sessions} />
        <Stat label="Partidas" value={stats.plays} />
        <Stat label="Horas jugadas" value={stats.hoursPlayed.toLocaleString("es-ES")} />
      </div>
      <Ranking
        title="Juegos más jugados"
        unit={["partida", "partidas"]}
        rows={stats.mostPlayed.map((g) => ({
          name: gameName.get(g.id) ?? "?",
          count: g.count,
          href: withRange(`game=${g.id}`),
          items: g.items.map((p) => ({ href: `/plays/${p.id}`, label: formatShortDate(p.date) })),
        }))}
      />
      <Ranking
        title="Asistencia"
        unit={["sesión", "sesiones"]}
        rows={stats.attendance.map((a) => ({
          name: playerName.get(a.id) ?? "?",
          count: a.count,
          href: withRange(`player=${a.id}`),
          avatarUrl: avatarUrl.get(a.id) ?? null,
          items: a.items.map((s) => ({ href: `/sessions/${s.id}`, label: formatShortDate(s.date) })),
        }))}
      />
      <section className="card space-y-2">
        <h2>La vergüenza de la estantería</h2>
        {stats.neverPlayed.length === 0 ? (
          <p className="text-sm text-muted">¡Ninguno! Hemos jugado a todo.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {stats.neverPlayed.map((id) => (
              <li key={id}>
                <Link href={`/games/${id}`} className="underline">
                  {gameName.get(id)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function PlayerView({
  id,
  name,
  data,
  range,
  gameName,
  playerName,
}: {
  id: string;
  name: string;
  data: Awaited<ReturnType<typeof loadStatsData>>;
  range: DateRange;
  gameName: Map<string, string>;
  playerName: Map<string, string>;
}) {
  const stats = playerStats(id, data.plays, range);
  return (
    <>
      <h2 className="text-xl">{name}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Partidas" value={stats.plays} />
        <Stat label="Victorias" value={stats.wins} />
        <Stat label="% victorias en competitivo" value={stats.competitiveWinRate === null ? "–" : `${stats.competitiveWinRate} %`} />
        <Stat label="Mejor racha de victorias" value={stats.longestWinStreak} />
        <Stat label="Racha actual" value={stats.currentWinStreak} />
      </div>
      <section className="card space-y-1 text-sm">
        <p>
          <span className="text-muted">Juego favorito: </span>
          {stats.favoriteGame ? `${gameName.get(stats.favoriteGame.id)} (${stats.favoriteGame.count})` : "–"}
        </p>
        <p>
          <span className="text-muted">Némesis: </span>
          {stats.nemesis ? `${playerName.get(stats.nemesis.id)}, le ha ganado ${stats.nemesis.count} ${stats.nemesis.count === 1 ? "vez" : "veces"}` : "–"}
        </p>
      </section>
    </>
  );
}

function GameView({
  game,
  data,
  range,
  playerName,
}: {
  game: Awaited<ReturnType<typeof loadStatsData>>["games"][number];
  data: Awaited<ReturnType<typeof loadStatsData>>;
  range: DateRange;
  playerName: Map<string, string>;
}) {
  const stats = gameStats(game, data.plays, range);
  const avatarUrl = new Map(data.players.map((p) => [p.id, p.avatarUrl]));
  return (
    <>
      <h2 className="text-xl">
        <Link href={`/games/${game.id}`} className="underline">
          {game.name}
        </Link>
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Veces jugado" value={stats.plays} />
        <Stat label="Última vez" value={stats.lastPlayed ? formatShortDate(stats.lastPlayed) : "–"} />
        <Stat label="Duración real media" value={formatDuration(stats.averageMinutes) ?? "–"} />
        <Stat label="Duración estimada" value={formatDuration(stats.estimatedMinutes) ?? "–"} />
        {stats.coopPlays > 0 && <Stat label={`Victorias del grupo (${stats.coopPlays})`} value={`${stats.coopWinRate} %`} />}
      </div>
      {stats.topWinners.length > 0 && (
        <Ranking title="Quién gana más" unit={["victoria", "victorias"]} rows={stats.topWinners.map((w) => ({ name: playerName.get(w.id) ?? "?", count: w.count, avatarUrl: avatarUrl.get(w.id) ?? null }))} />
      )}
    </>
  );
}
