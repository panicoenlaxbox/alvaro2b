import { describe, expect, it } from "vitest";
import { gameStats, groupStats, parseRange, playerStats, type StatsGame, type StatsPlay, type StatsSession } from "./stats";

const comp = (id: string, date: string, gameId: string, ranks: Record<string, number | null>, minutes: number | null = 30): StatsPlay => ({
  id,
  sessionId: `s-${date}`,
  date,
  gameId,
  mode: "competitive",
  durationMinutes: minutes,
  coopWon: null,
  participants: Object.entries(ranks).map(([playerId, rank]) => ({ playerId, rank, teamId: null })),
  teams: [],
});

const coop = (id: string, date: string, gameId: string, players: string[], won: boolean | null): StatsPlay => ({
  id,
  sessionId: `s-${date}`,
  date,
  gameId,
  mode: "cooperative",
  durationMinutes: 60,
  coopWon: won,
  participants: players.map((playerId) => ({ playerId, rank: null, teamId: null })),
  teams: [],
});

const team = (id: string, date: string, gameId: string, red: string[], blue: string[], redWon: boolean): StatsPlay => ({
  id,
  sessionId: `s-${date}`,
  date,
  gameId,
  mode: "team",
  durationMinutes: 20,
  coopWon: null,
  participants: [...red.map((p) => ({ playerId: p, rank: null, teamId: "red" })), ...blue.map((p) => ({ playerId: p, rank: null, teamId: "blue" }))],
  teams: [
    { id: "red", won: redWon },
    { id: "blue", won: !redWon },
  ],
});

const plays: StatsPlay[] = [
  comp("p1", "2025-12-20", "azul", { ana: 1, bruno: 2, carla: 3 }, 40),
  comp("p2", "2026-01-10", "azul", { ana: 2, bruno: 1, carla: 3 }, 50),
  comp("p3", "2026-02-01", "catan", { ana: 3, bruno: 1, carla: 1 }, null),
  coop("p4", "2026-02-01", "pandemic", ["ana", "bruno", "carla"], true),
  coop("p5", "2026-03-15", "pandemic", ["ana", "bruno"], false),
  team("p6", "2026-03-15", "codenames", ["ana", "carla"], ["bruno"], true),
  comp("p7", "2026-04-01", "azul", { ana: 1, bruno: 2 }, 30),
];

const games: StatsGame[] = [
  { id: "azul", name: "Azul", retired: false, minDuration: 30, maxDuration: 45 },
  { id: "catan", name: "Catan", retired: false, minDuration: 60, maxDuration: 120 },
  { id: "pandemic", name: "Pandemic", retired: false, minDuration: 45, maxDuration: 45 },
  { id: "codenames", name: "Codenames", retired: false, minDuration: 15, maxDuration: null },
  { id: "wingspan", name: "Wingspan", retired: false, minDuration: 40, maxDuration: 70 },
  { id: "old", name: "Old", retired: true, minDuration: null, maxDuration: null },
];

const sessions: StatsSession[] = [
  { id: "s1", date: "2025-12-20", status: "held", attendees: ["ana", "bruno", "carla"] },
  { id: "s2", date: "2026-01-10", status: "held", attendees: ["ana", "bruno", "carla", "dani"] },
  { id: "s3", date: "2026-03-15", status: "held", attendees: ["ana", "bruno", "carla"] },
  { id: "s4", date: "2026-05-01", status: "cancelled", attendees: ["ana"] },
];

describe("parseRange", () => {
  it("turns a year into a range", () => expect(parseRange({ year: "2026" })).toEqual({ from: "2026-01-01", to: "2026-12-31" }));
  it("ignores invalid dates", () => expect(parseRange({ from: "ayer", to: "2026-03-01" })).toEqual({ from: undefined, to: "2026-03-01" }));
});

describe("groupStats", () => {
  it("counts held Sessions, Plays, hours, most played, shelf of shame and attendance", () => {
    const stats = groupStats(sessions, plays, games, {});
    expect(stats.sessions).toBe(3);
    expect(stats.plays).toBe(7);
    expect(stats.hoursPlayed).toBe(4.3); // 40 + 50 + 60 + 60 + 20 + 30 = 260 min; p3 has no duration
    expect(stats.mostPlayed[0]).toMatchObject({ id: "azul", count: 3 });
    expect(stats.neverPlayed).toEqual(["wingspan"]);
    expect(stats.attendance[0]).toMatchObject({ id: "ana", count: 3 });
    expect(stats.attendance.find((a) => a.id === "dani")).toMatchObject({ id: "dani", count: 1 });
  });

  it("lists the Plays and Sessions behind each count, newest first", () => {
    const stats = groupStats(sessions, plays, games, { from: "2026-01-01" });
    expect(stats.mostPlayed[0]).toEqual({
      id: "azul",
      count: 2,
      items: [
        { id: "p7", date: "2026-04-01" },
        { id: "p2", date: "2026-01-10" },
      ],
    });
    expect(stats.attendance.find((a) => a.id === "dani")).toEqual({ id: "dani", count: 1, items: [{ id: "s2", date: "2026-01-10" }] });
  });

  it("filters by date range but keeps the shelf of shame absolute", () => {
    const stats = groupStats(sessions, plays, games, { from: "2026-01-01", to: "2026-12-31" });
    expect(stats.sessions).toBe(2);
    expect(stats.plays).toBe(6);
    expect(stats.neverPlayed).toEqual(["wingspan"]);
  });
});

describe("playerStats", () => {
  it("counts Plays, wins across modes, competitive rate, favorite and nemesis", () => {
    const ana = playerStats("ana", plays, {});
    expect(ana.plays).toBe(7);
    // Wins: p1, p4 (coop won), p6 (team), p7.
    expect(ana.wins).toBe(4);
    expect(ana.competitivePlays).toBe(4);
    expect(ana.competitiveWins).toBe(2);
    expect(ana.competitiveWinRate).toBe(50);
    expect(ana.favoriteGame).toEqual({ id: "azul", count: 3 });
    // Bruno ranked above Ana in p2 and p3, Carla only in p3.
    expect(ana.nemesis).toEqual({ id: "bruno", count: 2 });
  });

  it("computes win streaks in date order", () => {
    const ana = playerStats("ana", plays, {});
    // p1 W, p2 L, p3 L, p4 W (coop), p5 L, p6 W, p7 W → longest 2, current 2.
    expect(ana.longestWinStreak).toBe(2);
    expect(ana.currentWinStreak).toBe(2);
  });

  it("has no rate without competitive Plays", () => {
    expect(playerStats("dani", plays, {}).competitiveWinRate).toBeNull();
  });
});

describe("gameStats", () => {
  it("summarizes a competitive Game", () => {
    const stats = gameStats(games[0]!, plays, {});
    expect(stats.plays).toBe(3);
    expect(stats.lastPlayed).toBe("2026-04-01");
    expect(stats.averageMinutes).toBe(40);
    expect(stats.estimatedMinutes).toBe(38);
    expect(stats.topWinners[0]).toEqual({ id: "ana", count: 2 });
  });

  it("gives the group win rate in cooperative Games", () => {
    const stats = gameStats(games[2]!, plays, {});
    expect(stats.coopPlays).toBe(2);
    expect(stats.coopWinRate).toBe(50);
    expect(stats.topWinners).toEqual([]);
  });

  it("is empty for a Game never played", () => {
    expect(gameStats(games[4]!, plays, {})).toMatchObject({ plays: 0, lastPlayed: null, averageMinutes: null, coopWinRate: null });
  });
});
