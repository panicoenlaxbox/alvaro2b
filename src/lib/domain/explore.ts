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
  ownerId: string | null;
  retired: boolean;
  playCount: number;
  /** YYYY-MM-DD of the last Session with a Play of this Game. */
  lastPlayed: string | null;
  averageRating: number | null;
  myRating: number | null;
};

export type GameFilters = {
  query?: string;
  players?: number;
  /** Fits in this many minutes. */
  maxMinutes?: number;
  minComplexity?: number;
  maxComplexity?: number;
  mode?: PlayMode;
  /** Owned by any of these Players. */
  ownerIds?: string[];
  /** Not played in the last N days (never played counts). */
  notPlayedForDays?: number;
  neverPlayed?: boolean;
  minRating?: number;
  /** Games the current Member rated 4 or 5 stars. */
  iLikeIt?: boolean;
};

export const SORTS = ["name", "rating", "most-played", "least-recent", "complexity", "duration"] as const;
export type GameSort = (typeof SORTS)[number];

export const SORT_LABELS: Record<GameSort, string> = {
  name: "Nombre",
  rating: "Valoración",
  "most-played": "Más jugados",
  "least-recent": "Hace más que no se juega",
  complexity: "Complejidad",
  duration: "Duración",
};

export const LIKED_STARS = 4;

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

/**
 * Applies the Catalog filters (PRD 3). Retired games never appear. When a filter is active and the
 * Game lacks that data (for example, no player count), the Game is left out.
 */
export function filterGames<T extends ExplorableGame>(games: T[], f: GameFilters, today: string): T[] {
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
    if (f.minComplexity !== undefined && (g.complexity === null || g.complexity < f.minComplexity)) return false;
    if (f.maxComplexity !== undefined && (g.complexity === null || g.complexity > f.maxComplexity)) return false;
    if (f.mode && g.mode !== f.mode) return false;
    if (f.ownerIds && (g.ownerId === null || !f.ownerIds.includes(g.ownerId))) return false;
    if (f.neverPlayed && g.playCount > 0) return false;
    if (f.notPlayedForDays !== undefined && g.lastPlayed !== null && daysBetween(g.lastPlayed, today) < f.notPlayedForDays) {
      return false;
    }
    if (f.minRating !== undefined && (g.averageRating === null || g.averageRating < f.minRating)) return false;
    if (f.iLikeIt && (g.myRating === null || g.myRating < LIKED_STARS)) return false;
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
      case "duration":
        return nullsLast(a.minDuration ?? a.maxDuration, b.minDuration ?? b.maxDuration, 1) || byName(a, b);
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
  const owners = params.owner;
  return {
    sort: SORTS.includes(sort as GameSort) ? (sort as GameSort) : "name",
    filters: {
      query: one("q")?.slice(0, 100) || undefined,
      players: positive(one("players"), 100),
      maxMinutes: positive(one("minutes"), 6000),
      minComplexity: positive(one("cmin"), 5, true),
      maxComplexity: positive(one("cmax"), 5, true),
      mode: mode === "competitive" || mode === "cooperative" || mode === "team" ? mode : undefined,
      ownerIds: owners ? (Array.isArray(owners) ? owners : [owners]).filter(Boolean) : undefined,
      notPlayedForDays: positive(one("since"), 36500),
      neverPlayed: one("never") === "1" || undefined,
      minRating: positive(one("rating"), 5, true),
      iLikeIt: one("liked") === "1" || undefined,
    },
  };
}

/**
 * The query string for a filters form: empty fields and the default sort are left out, so the URL
 * only shows what is filtered. Fields in `keepEmpty` stay even when empty (a Session's "players="
 * means "any number", not "as many as the Attendees").
 */
export function filterQuery(entries: [string, string][], keepEmpty: string[] = []): string {
  const kept = entries.filter(([key, value]) => (value !== "" || keepEmpty.includes(key)) && !(key === "sort" && value === "name"));
  return new URLSearchParams(kept).toString();
}
