import type { PlayMode } from "./game-form";
import { winnersOf } from "./play";

/** Everything the statistics need, already loaded. Kept free of database types. */
export type StatsPlay = {
  id: string;
  sessionId: string;
  date: string;
  gameId: string;
  mode: PlayMode;
  durationMinutes: number | null;
  coopWon: boolean | null;
  participants: { playerId: string; rank: number | null; teamId: string | null }[];
  teams: { id: string; won: boolean }[];
};

export type StatsSession = { id: string; date: string; attendees: string[] };

export type StatsGame = {
  id: string;
  name: string;
  retired: boolean;
  minDuration: number | null;
  maxDuration: number | null;
};

export type DateRange = { from?: string; to?: string };

export function inRange(date: string, range: DateRange): boolean {
  return (!range.from || date >= range.from) && (!range.to || date <= range.to);
}

/** Range for a year filter ("2026") or explicit dates; invalid input means no limit. */
export function parseRange(params: { year?: string; from?: string; to?: string }): DateRange {
  const date = /^\d{4}-\d{2}-\d{2}$/;
  if (params.year && /^\d{4}$/.test(params.year)) return { from: `${params.year}-01-01`, to: `${params.year}-12-31` };
  return { from: params.from && date.test(params.from) ? params.from : undefined, to: params.to && date.test(params.to) ? params.to : undefined };
}

function countBy<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return counts;
}

function topEntries(counts: Map<string, number>, limit = Infinity): { id: string; count: number }[] {
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, limit);
}

/** A ranking entry with the Plays or Sessions behind its count, newest first. */
export type RankedEntry = { id: string; count: number; items: { id: string; date: string }[] };

function rankBy<T extends { id: string; date: string }>(items: T[], keys: (item: T) => string[], limit = Infinity): RankedEntry[] {
  const groups = new Map<string, { id: string; date: string }[]>();
  for (const item of items) for (const key of keys(item)) groups.set(key, [...(groups.get(key) ?? []), { id: item.id, date: item.date }]);
  return [...groups.entries()]
    .map(([id, list]) => ({ id, count: list.length, items: list.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)) }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Group
// ---------------------------------------------------------------------------

export type GroupStats = {
  sessions: number;
  plays: number;
  hoursPlayed: number;
  mostPlayed: RankedEntry[];
  /** "La vergüenza de la estantería": active Games never played (ever, not just in the range). */
  neverPlayed: string[];
  attendance: RankedEntry[];
};

export function groupStats(sessions: StatsSession[], plays: StatsPlay[], games: StatsGame[], range: DateRange): GroupStats {
  // A Session counts once it has a Play: Sessions have no status, and one never played adds nothing.
  const playedIn = new Set(plays.map((p) => p.sessionId));
  const played = sessions.filter((s) => playedIn.has(s.id) && inRange(s.date, range));
  const ranged = plays.filter((p) => inRange(p.date, range));
  const everPlayed = new Set(plays.map((p) => p.gameId));
  const minutes = ranged.reduce((sum, p) => sum + (p.durationMinutes ?? 0), 0);

  return {
    sessions: played.length,
    plays: ranged.length,
    hoursPlayed: Math.round((minutes / 60) * 10) / 10,
    mostPlayed: rankBy(ranged, (p) => [p.gameId], 10),
    neverPlayed: games.filter((g) => !g.retired && !everPlayed.has(g.id)).map((g) => g.id),
    attendance: rankBy(played, (s) => s.attendees),
  };
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export type PlayerStats = {
  plays: number;
  wins: number;
  competitivePlays: number;
  competitiveWins: number;
  /** Percentage, or null without competitive Plays. */
  competitiveWinRate: number | null;
  favoriteGame: { id: string; count: number } | null;
  /** Who beats this Player most often in competitive Plays. */
  nemesis: { id: string; count: number } | null;
  longestWinStreak: number;
  currentWinStreak: number;
};

function chronological(plays: StatsPlay[]): StatsPlay[] {
  return [...plays].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function playerStats(playerId: string, plays: StatsPlay[], range: DateRange): PlayerStats {
  const mine = chronological(plays.filter((p) => inRange(p.date, range) && p.participants.some((x) => x.playerId === playerId)));
  const won = (p: StatsPlay) => winnersOf(p).includes(playerId);
  const competitive = mine.filter((p) => p.mode === "competitive");
  const competitiveWins = competitive.filter(won).length;

  // Beaten by: everyone ranked above this Player in a competitive Play.
  const beatenBy = new Map<string, number>();
  for (const p of competitive) {
    const myRank = p.participants.find((x) => x.playerId === playerId)?.rank;
    if (myRank === null || myRank === undefined) continue;
    for (const other of p.participants) {
      if (other.playerId !== playerId && other.rank !== null && other.rank < myRank) {
        beatenBy.set(other.playerId, (beatenBy.get(other.playerId) ?? 0) + 1);
      }
    }
  }

  // Streaks count consecutive Plays won, in date order, across all modes.
  let longest = 0;
  let current = 0;
  for (const p of mine) {
    current = won(p) ? current + 1 : 0;
    longest = Math.max(longest, current);
  }

  return {
    plays: mine.length,
    wins: mine.filter(won).length,
    competitivePlays: competitive.length,
    competitiveWins,
    competitiveWinRate: competitive.length ? Math.round((competitiveWins / competitive.length) * 100) : null,
    favoriteGame: topEntries(countBy(mine, (p) => p.gameId), 1)[0] ?? null,
    nemesis: topEntries(beatenBy, 1)[0] ?? null,
    longestWinStreak: longest,
    currentWinStreak: current,
  };
}

// ---------------------------------------------------------------------------
// Game
// ---------------------------------------------------------------------------

export type GameStats = {
  plays: number;
  lastPlayed: string | null;
  averageMinutes: number | null;
  /** Midpoint of the Game's own duration range. */
  estimatedMinutes: number | null;
  topWinners: { id: string; count: number }[];
  /** Cooperative Plays with a result: percentage the group won. */
  coopWinRate: number | null;
  coopPlays: number;
};

export function gameStats(game: StatsGame, plays: StatsPlay[], range: DateRange): GameStats {
  const ranged = plays.filter((p) => p.gameId === game.id && inRange(p.date, range));
  const timed = ranged.filter((p) => p.durationMinutes !== null);
  const coop = ranged.filter((p) => p.mode === "cooperative" && p.coopWon !== null);
  const bounds = [game.minDuration, game.maxDuration].filter((d): d is number => d !== null);

  return {
    plays: ranged.length,
    lastPlayed: ranged.map((p) => p.date).sort().at(-1) ?? null,
    averageMinutes: timed.length ? Math.round(timed.reduce((s, p) => s + p.durationMinutes!, 0) / timed.length) : null,
    estimatedMinutes: bounds.length ? Math.round(bounds.reduce((a, b) => a + b, 0) / bounds.length) : null,
    topWinners: topEntries(
      countBy(
        ranged.filter((p) => p.mode !== "cooperative").flatMap((p) => winnersOf(p)),
        (id) => id,
      ),
      3,
    ),
    coopWinRate: coop.length ? Math.round((coop.filter((p) => p.coopWon).length / coop.length) * 100) : null,
    coopPlays: coop.length,
  };
}
