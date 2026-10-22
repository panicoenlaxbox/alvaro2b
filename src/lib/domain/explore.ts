import type { PlayMode } from "./game-form";

export type ExplorableGame = {
  id: string;
  name: string;
  minPlayers: number | null;
  maxPlayers: number | null;
  minDuration: number | null;
  maxDuration: number | null;
  complexity: number | null;
  mode: PlayMode;
  retired: boolean;
  playCount: number;
  /** YYYY-MM-DD of the last Session with a Play of this Game. */
  lastPlayed: string | null;
  averageRating: number | null;
};

export type GameFilters = {
  query?: string;
  players?: number;
  /** Fits in this many minutes. */
  maxMinutes?: number;
  mode?: PlayMode;
  neverPlayed?: boolean;
  minRating?: number;
};

/** Accepted range of each numeric filter and the longest name searched; the filter inputs use them too. */
export const FILTER_LIMITS = {
  query: 100,
  players: { min: 1, max: 100 },
  minutes: { min: 1, max: 6000 },
  rating: { min: 1, max: 5 },
} as const;

export const SORTS = [
  "name",
  "rating",
  "most-played",
  "least-recent",
  "complexity",
  "complexity-desc",
  "duration",
  "duration-desc",
] as const;
export type GameSort = (typeof SORTS)[number];

export const SORT_LABELS: Record<GameSort, string> = {
  name: "Nombre",
  rating: "Valoración",
  "most-played": "Más jugados",
  "least-recent": "Más tiempo sin jugar",
  complexity: "Menos complejos",
  "complexity-desc": "Más complejos",
  duration: "Más cortos",
  "duration-desc": "Más largos",
};

/**
 * Applies the Catalog filters. Retired games never appear. When a filter is active and the
 * Game lacks that data (for example, no player count), the Game is left out.
 */
export function filterGames<T extends ExplorableGame>(games: T[], f: GameFilters): T[] {
  const query = f.query?.trim().toLocaleLowerCase("es");
  return games.filter((g) => {
    if (g.retired) return false;
    if (query && !g.name.toLocaleLowerCase("es").includes(query)) return false;
    if (f.players !== undefined) {
      if (g.minPlayers === null && g.maxPlayers === null) return false;
      if ((g.minPlayers ?? 1) > f.players || (g.maxPlayers ?? Infinity) < f.players) return false;
    }
    if (f.maxMinutes !== undefined) {
      const shortest = g.minDuration ?? g.maxDuration;
      if (shortest === null || shortest > f.maxMinutes) return false;
    }
    if (f.mode && g.mode !== f.mode) return false;
    if (f.neverPlayed && g.playCount > 0) return false;
    if (f.minRating !== undefined && (g.averageRating === null || g.averageRating < f.minRating)) return false;
    return true;
  });
}

const byName = (a: ExplorableGame, b: ExplorableGame) => a.name.localeCompare(b.name, "es");
/** Unknown values go last whatever the direction. */
const nullsLast = (a: number | null, b: number | null, dir: 1 | -1) =>
  a === null ? (b === null ? 0 : 1) : b === null ? -1 : (a - b) * dir;

export function sortGames<T extends ExplorableGame>(games: T[], sort: GameSort): T[] {
  const sorted = [...games];
  sorted.sort((a, b) => {
    switch (sort) {
      case "rating":
        return nullsLast(a.averageRating, b.averageRating, -1) || byName(a, b);
      case "most-played":
        return b.playCount - a.playCount || byName(a, b);
      case "least-recent":
        // Never played first, then the oldest last Play.
        if (a.lastPlayed === b.lastPlayed) return byName(a, b);
        if (a.lastPlayed === null) return -1;
        if (b.lastPlayed === null) return 1;
        return a.lastPlayed.localeCompare(b.lastPlayed) || byName(a, b);
      case "complexity":
        return nullsLast(a.complexity, b.complexity, 1) || byName(a, b);
      case "complexity-desc":
        return nullsLast(a.complexity, b.complexity, -1) || byName(a, b);
      case "duration":
        return nullsLast(a.minDuration ?? a.maxDuration, b.minDuration ?? b.maxDuration, 1) || byName(a, b);
      case "duration-desc":
        // The longest a Game can take, so a wide range counts by its upper bound.
        return nullsLast(a.maxDuration ?? a.minDuration, b.maxDuration ?? b.minDuration, -1) || byName(a, b);
      default:
        return byName(a, b);
    }
  });
  return sorted;
}

/** "Sorpréndeme": a random Game among the results. `random` is injectable for tests. */
export function pickRandom<T>(items: T[], random: () => number = Math.random): T | null {
  if (items.length === 0) return null;
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))]!;
}

function positive(value: string | undefined, max: number, decimals = false): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0 || n > max || (!decimals && !Number.isInteger(n))) return undefined;
  return n;
}

/** Reads the filters from the URL search params of /games. Invalid values are ignored. */
export function parseFilters(params: Record<string, string | string[] | undefined>): { filters: GameFilters; sort: GameSort } {
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const mode = one("mode");
  const sort = one("sort");
  return {
    sort: SORTS.includes(sort as GameSort) ? (sort as GameSort) : "name",
    filters: {
      query: one("q")?.slice(0, FILTER_LIMITS.query) || undefined,
      players: positive(one("players"), FILTER_LIMITS.players.max),
      maxMinutes: positive(one("minutes"), FILTER_LIMITS.minutes.max),
      mode: mode === "competitive" || mode === "cooperative" || mode === "team" ? mode : undefined,
      neverPlayed: one("never") === "1" || undefined,
      minRating: positive(one("rating"), FILTER_LIMITS.rating.max, true),
    },
  };
}

/** The query string for a filters form: empty fields and the default sort are left out, so the URL only shows what is filtered. */
export function filterQuery(entries: [string, string][]): string {
  const kept = entries.filter(([key, value]) => value !== "" && !(key === "sort" && value === "name"));
  return new URLSearchParams(kept).toString();
}
