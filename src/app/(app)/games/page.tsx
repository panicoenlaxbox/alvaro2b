import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { listCatalogGames } from "@/lib/data/explore";
import { FILTER_LIMITS, filterGames, parseFilters, SORT_LABELS, SORTS, sortGames } from "@/lib/domain/explore";
import { durationText, PLAY_MODE_LABELS, PLAY_MODES, playersText, type PlayMode } from "@/lib/domain/game-form";
import { formatShortDate } from "@/lib/domain/session";
import { coverUrl, signedUrls } from "@/lib/storage";
import { FilterForm } from "@/components/auto-submit-form";
import { OwnerFaces } from "@/components/owners";
import { SortSelect } from "@/components/sort-select";
import { StarFilter } from "@/components/star-filter";
import { CHIP } from "@/components/game-choices";
import type { Owner } from "@/lib/data/people";
import { tint } from "@/components/tint";

export const metadata: Metadata = { title: "Juegos" };

export default async function GamesPage({ searchParams }: PageProps<"/games">) {
  await requireMember();
  const params = await searchParams;
  const showRetired = params.retired === "1";
  const games = await listCatalogGames();

  // The Catalog searches by name, mode, Rating and never played; players and time are the Home's questions.
  const parsed = parseFilters(params);
  const { query, mode, minRating, neverPlayed } = parsed.filters;
  const filters = { query, mode, minRating, neverPlayed };
  const sort = parsed.sort;
  const results = showRetired
    ? sortGames(games.filter((g) => g.retired), "name")
    : sortGames(filterGames(games, filters), sort);
  const signed = await signedUrls(results.map((g) => g.coverPath));
  const activeFilters = Object.values(filters).filter((v) => v !== undefined).length;

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="text-3xl sm:text-4xl">{showRetired ? "Juegos retirados" : "Juegos"}</h1>
        </div>
        <Link href="/games/new" className="btn-primary shrink-0">
          Añadir
        </Link>
      </section>

      {!showRetired && (
        <FilterForm key={JSON.stringify(params)} action="/games" className="card space-y-4" aria-label="Filtros">
          <input type="hidden" name="sort" value={sort} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="col-span-2">
              <span className="label">Nombre</span>
              <input name="q" maxLength={FILTER_LIMITS.query} defaultValue={filters.query ?? ""} className="input" />
            </label>
            <label>
              <span className="label">Modo</span>
              <select name="mode" defaultValue={filters.mode ?? ""} className="input">
                <option value="">Todos</option>
                {PLAY_MODES.map((m) => (
                  <option key={m} value={m}>
                    {PLAY_MODE_LABELS[m]}
                  </option>
                ))}
              </select>
            </label>
            {/* Beside the mode, so the filters take less of a phone's screen before the results. */}
            <div className="flex items-end">
              <Check name="never" checked={filters.neverPlayed}>
                Por estrenar
              </Check>
            </div>
          </div>
          <fieldset>
            <legend className="label">Valoración mínima</legend>
            <StarFilter name="rating" stars={filters.minRating ?? 0} />
          </fieldset>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary">
              Buscar
            </button>
            {activeFilters > 0 && (
              <Link href="/games" scroll={false} className="btn-secondary">
                Limpiar
              </Link>
            )}
          </div>
        </FilterForm>
      )}

      {!showRetired && results.length > 1 && (
        <div className="flex justify-end">
          <SortSelect options={SORTS.map((s) => ({ value: s, label: SORT_LABELS[s] }))} current={sort} fallback="name" />
        </div>
      )}

      {results.length > 0 ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((g) => (
            <li key={g.id}>
              <GameCard
                game={g}
                cover={coverUrl({ cover_path: g.coverPath, bgg_image_url: g.bggImageUrl }, signed)}
                details={[playersText(g.minPlayers, g.maxPlayers), durationText(g.minDuration, g.maxDuration)].filter(Boolean).join(" · ")}
                owners={g.owners}
              />
            </li>
          ))}
        </ul>
      ) : showRetired || games.some((g) => !g.retired) ? (
        <div className="space-y-4 rounded-2xl border-[3px] border-dashed border-border p-8 text-center text-lg text-soft">
          {showRetired ? (
            <p>No hay juegos retirados.</p>
          ) : (
            <p>Ningún juego encaja con todo eso. Quita algún filtro… o habrá que comprar uno nuevo.</p>
          )}
        </div>
      ) : null}

      <div className="flex justify-center">
        <Link href={showRetired ? "/games" : "/games?retired=1"} className="btn-secondary">
          {showRetired ? "Volver al catálogo" : "Ver juegos retirados"}
        </Link>
      </div>
    </div>
  );
}

/** A filter that is on or off, as a pill that turns yellow when on. */
function Check({ name, checked, children }: { name: string; checked?: boolean; children: React.ReactNode }) {
  return (
    <label className="inline-flex">
      <input type="checkbox" name={name} value="1" defaultChecked={checked} className="peer sr-only" />
      <span className={CHIP}>{children}</span>
    </label>
  );
}

const MODE_TAG: Record<PlayMode, { label: string; className: string }> = {
  competitive: { label: "Versus", className: "text-danger" },
  cooperative: { label: "Coop", className: "text-teal" },
  team: { label: "Equipos", className: "text-blue" },
};

/* eslint-disable @next/next/no-img-element -- covers are signed or external URLs that change hourly */
function GameCard({
  game,
  cover,
  details,
  owners,
}: {
  game: { id: string; name: string; mode: PlayMode; playCount: number; lastPlayed: string | null; averageRating: number | null };
  cover: string | null;
  details: string;
  owners: Owner[];
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
          <span aria-hidden className="max-w-full truncate px-4 font-display text-4xl text-paper uppercase [text-shadow:3px_3px_0_var(--ink)]">
            {game.name}
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
          <OwnerFaces owners={owners} />
          <span className="ml-auto">
            {game.playCount === 0 ? "Por estrenar" : `${game.playCount} ${game.playCount === 1 ? "partida" : "partidas"} · ${formatShortDate(game.lastPlayed!)}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
