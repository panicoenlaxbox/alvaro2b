import { describe, expect, it } from "vitest";
import { filterGames, filterQuery, parseFilters, pickRandom, sortGames, type ExplorableGame } from "./explore";

const game = (id: string, change: Partial<ExplorableGame> = {}): ExplorableGame => ({
  id,
  name: id,
  minPlayers: 2,
  maxPlayers: 4,
  minDuration: 30,
  maxDuration: 60,
  complexity: 2,
  mode: "competitive",
  ownerIds: [],
  retired: false,
  playCount: 0,
  lastPlayed: null,
  averageRating: null,
  myRating: null,
  ...change,
});

const today = "2026-10-20";
const ids = (games: ExplorableGame[]) => games.map((g) => g.id);

describe("filterGames", () => {
  it("never shows retired games", () => {
    expect(ids(filterGames([game("a"), game("b", { retired: true })], {}, today))).toEqual(["a"]);
  });

  it("filters by player count, treating a missing bound as open", () => {
    const games = [game("2-4"), game("5+", { minPlayers: 5, maxPlayers: null }), game("unknown", { minPlayers: null, maxPlayers: null })];
    expect(ids(filterGames(games, { players: 5 }, today))).toEqual(["5+"]);
    expect(ids(filterGames(games, { players: 3 }, today))).toEqual(["2-4"]);
  });

  it("filters by the time available", () => {
    const games = [game("short", { minDuration: 15, maxDuration: 15 }), game("long", { minDuration: 90, maxDuration: 120 })];
    expect(ids(filterGames(games, { maxMinutes: 45 }, today))).toEqual(["short"]);
  });

  it("filters by complexity, mode and Owner", () => {
    const games = [
      game("light", { complexity: 1.2, ownerIds: ["ana"] }),
      game("heavy", { complexity: 3.8, mode: "cooperative", ownerIds: ["bruno", "dani"] }),
    ];
    expect(ids(filterGames(games, { minComplexity: 3 }, today))).toEqual(["heavy"]);
    expect(ids(filterGames(games, { maxComplexity: 2 }, today))).toEqual(["light"]);
    expect(ids(filterGames(games, { mode: "cooperative" }, today))).toEqual(["heavy"]);
    expect(ids(filterGames(games, { ownerIds: ["ana", "carla"] }, today))).toEqual(["light"]);
    expect(ids(filterGames(games, { ownerIds: ["dani"] }, today))).toEqual(["heavy"]);
    expect(ids(filterGames([game("nobody's")], { ownerIds: ["ana"] }, today))).toEqual([]);
  });

  it("filters by history", () => {
    const games = [
      game("never"),
      game("recent", { playCount: 3, lastPlayed: "2026-10-10" }),
      game("old", { playCount: 1, lastPlayed: "2026-01-05" }),
    ];
    expect(ids(filterGames(games, { neverPlayed: true }, today))).toEqual(["never"]);
    expect(ids(filterGames(games, { notPlayedForDays: 30 }, today))).toEqual(["never", "old"]);
  });

  it("filters by Rating and by what I like", () => {
    const games = [game("loved", { averageRating: 4.5, myRating: 5 }), game("meh", { averageRating: 2.5, myRating: 3 }), game("unrated")];
    expect(ids(filterGames(games, { minRating: 4 }, today))).toEqual(["loved"]);
    expect(ids(filterGames(games, { iLikeIt: true }, today))).toEqual(["loved"]);
  });

  it("searches by name ignoring case", () => {
    expect(ids(filterGames([game("Azul"), game("Catan")], { query: "azu" }, today))).toEqual(["Azul"]);
  });
});

describe("sortGames", () => {
  const games = [
    game("Catan", { averageRating: 3, playCount: 5, lastPlayed: "2026-10-01", complexity: 2.3 }),
    game("Azul", { averageRating: 4.5, playCount: 2, lastPlayed: "2026-05-01", complexity: 1.8 }),
    game("Wingspan", { averageRating: null, playCount: 0, complexity: null }),
  ];

  it("sorts by name", () => expect(ids(sortGames(games, "name"))).toEqual(["Azul", "Catan", "Wingspan"]));
  it("sorts by Rating with unrated last", () => expect(ids(sortGames(games, "rating"))).toEqual(["Azul", "Catan", "Wingspan"]));
  it("sorts by plays", () => expect(ids(sortGames(games, "most-played"))).toEqual(["Catan", "Azul", "Wingspan"]));
  it("puts never played and oldest first", () => expect(ids(sortGames(games, "least-recent"))).toEqual(["Wingspan", "Azul", "Catan"]));
  it("sorts by complexity with unknown last", () => expect(ids(sortGames(games, "complexity"))).toEqual(["Azul", "Catan", "Wingspan"]));
});

describe("pickRandom", () => {
  it("picks within bounds", () => {
    expect(pickRandom(["a", "b", "c"], () => 0)).toBe("a");
    expect(pickRandom(["a", "b", "c"], () => 0.999)).toBe("c");
    expect(pickRandom([], () => 0.5)).toBeNull();
  });
});

describe("parseFilters", () => {
  it("reads valid params and ignores the rest", () => {
    const { filters, sort } = parseFilters({ players: "5", minutes: "abc", cmin: "2,5", mode: "team", owner: ["a", "b"], never: "1", sort: "rating" });
    expect(sort).toBe("rating");
    expect(filters).toMatchObject({ players: 5, minComplexity: 2.5, mode: "team", ownerIds: ["a", "b"], neverPlayed: true });
    expect(filters.maxMinutes).toBeUndefined();
  });

  it("defaults to sorting by name", () => expect(parseFilters({ sort: "nope" }).sort).toBe("name"));
});

describe("filterQuery", () => {
  it("leaves out empty fields and the default sort", () => {
    expect(filterQuery([["players", "4"], ["minutes", ""], ["mode", ""], ["q", ""], ["sort", "name"]])).toBe("players=4");
    expect(filterQuery([["sort", "rating"], ["owner", "a"], ["owner", "b"]])).toBe("sort=rating&owner=a&owner=b");
    expect(filterQuery([])).toBe("");
  });
  it("keeps the empty fields it is told to", () => {
    expect(filterQuery([["session", "s1"], ["players", ""], ["minutes", ""]], ["players"])).toBe("session=s1&players=");
  });
});
