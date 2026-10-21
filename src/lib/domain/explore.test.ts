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
  retired: false,
  playCount: 0,
  lastPlayed: null,
  averageRating: null,
  ...change,
});

const ids = (games: ExplorableGame[]) => games.map((g) => g.id);

describe("filterGames", () => {
  it("never shows retired games", () => {
    expect(ids(filterGames([game("a"), game("b", { retired: true })], {}))).toEqual(["a"]);
  });

  it("filters by player count, treating a missing bound as open", () => {
    const games = [game("2-4"), game("5+", { minPlayers: 5, maxPlayers: null }), game("unknown", { minPlayers: null, maxPlayers: null })];
    expect(ids(filterGames(games, { players: 5 }))).toEqual(["5+"]);
    expect(ids(filterGames(games, { players: 3 }))).toEqual(["2-4"]);
  });

  it("filters by the time available", () => {
    const games = [game("short", { minDuration: 15, maxDuration: 15 }), game("long", { minDuration: 90, maxDuration: 120 })];
    expect(ids(filterGames(games, { maxMinutes: 45 }))).toEqual(["short"]);
  });

  it("filters by mode", () => {
    const games = [game("versus"), game("coop", { mode: "cooperative" })];
    expect(ids(filterGames(games, { mode: "cooperative" }))).toEqual(["coop"]);
  });

  it("filters the Games never played", () => {
    const games = [
      game("never"),
      game("recent", { playCount: 3, lastPlayed: "2026-10-10" }),
      game("old", { playCount: 1, lastPlayed: "2026-01-05" }),
    ];
    expect(ids(filterGames(games, { neverPlayed: true }))).toEqual(["never"]);
  });

  it("filters by Rating", () => {
    const games = [game("loved", { averageRating: 4.5 }), game("meh", { averageRating: 2.5 }), game("unrated")];
    expect(ids(filterGames(games, { minRating: 4 }))).toEqual(["loved"]);
  });

  it("searches by name ignoring case", () => {
    expect(ids(filterGames([game("Azul"), game("Catan")], { query: "azu" }))).toEqual(["Azul"]);
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
    const { filters, sort } = parseFilters({ players: "5", minutes: "abc", rating: "3,5", mode: "team", never: "1", sort: "rating" });
    expect(sort).toBe("rating");
    expect(filters).toEqual({ players: 5, minRating: 3.5, mode: "team", neverPlayed: true });
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
});
