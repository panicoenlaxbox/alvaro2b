import { describe, expect, it } from "vitest";
import { computeRanking, formatDuration, parsePlayInput, toSavePlayPayload, validatePlay, winnersOf, type PlayInput } from "./play";

const p = (playerId: string, score: number | null = null, rank: number | null = null, teamKey: string | null = null) => ({
  playerId,
  score,
  rank,
  teamKey,
});

describe("computeRanking", () => {
  it("ranks by Score, higher first", () => {
    const ranks = computeRanking([p("ana", 40), p("bruno", 55), p("carla", 30)], false);
    expect(Object.fromEntries(ranks)).toEqual({ bruno: 1, ana: 2, carla: 3 });
  });

  it("ranks lower Score first when the Game says so", () => {
    const ranks = computeRanking([p("ana", 40), p("bruno", 55), p("carla", 30)], true);
    expect(Object.fromEntries(ranks)).toEqual({ carla: 1, ana: 2, bruno: 3 });
  });

  it("shares positions on ties and skips the next one", () => {
    const ranks = computeRanking([p("ana", 50), p("bruno", 50), p("carla", 30), p("dani", 20)], false);
    expect(Object.fromEntries(ranks)).toEqual({ ana: 1, bruno: 1, carla: 3, dani: 4 });
  });

  it("uses manual ranks when some Score is missing", () => {
    const ranks = computeRanking([p("ana", 50, 2), p("bruno", null, 1), p("carla", null, 3)], false);
    expect(Object.fromEntries(ranks)).toEqual({ bruno: 1, ana: 2, carla: 3 });
  });

  it("normalizes manual ties and leaves unmarked Participants unranked", () => {
    const ranks = computeRanking([p("ana", null, 1), p("bruno", null, 1), p("carla", null, 2), p("dani")], false);
    expect(Object.fromEntries(ranks)).toEqual({ ana: 1, bruno: 1, carla: 3, dani: null });
  });

  it("handles negative Scores and zero", () => {
    const ranks = computeRanking([p("ana", -3), p("bruno", 0)], true);
    expect(Object.fromEntries(ranks)).toEqual({ ana: 1, bruno: 2 });
  });
});

describe("winnersOf", () => {
  const participants = [
    { playerId: "ana", rank: 1, teamId: "red" },
    { playerId: "bruno", rank: 1, teamId: "blue" },
    { playerId: "carla", rank: 3, teamId: "red" },
  ];

  it("competitive: everyone ranked first", () => {
    expect(winnersOf({ mode: "competitive", coopWon: null, participants, teams: [] })).toEqual(["ana", "bruno"]);
  });

  it("cooperative: the whole group or nobody", () => {
    expect(winnersOf({ mode: "cooperative", coopWon: true, participants, teams: [] })).toEqual(["ana", "bruno", "carla"]);
    expect(winnersOf({ mode: "cooperative", coopWon: false, participants, teams: [] })).toEqual([]);
    expect(winnersOf({ mode: "cooperative", coopWon: null, participants, teams: [] })).toEqual([]);
  });

  it("team: the members of the winning Team", () => {
    const teams = [
      { id: "red", won: true },
      { id: "blue", won: false },
    ];
    expect(winnersOf({ mode: "team", coopWon: null, participants, teams })).toEqual(["ana", "carla"]);
  });
});

describe("validatePlay", () => {
  const base: PlayInput = {
    sessionId: "s",
    gameId: "g",
    mode: "competitive",
    expansionIds: [],
    participants: [p("ana", 10), p("bruno", 8)],
    teams: [],
    coopWon: null,
    durationMinutes: 45,
    notes: null,
  };

  it("accepts a competitive Play", () => expect(validatePlay(base)).toEqual({ ok: true }));
  it("accepts a Play without result", () => expect(validatePlay({ ...base, participants: [p("ana"), p("bruno")] }).ok).toBe(true));

  it.each<[string, Partial<PlayInput>, string]>([
    ["no game", { gameId: "" }, "juego"],
    ["no participants", { participants: [] }, "participante"],
    ["duplicates", { participants: [p("ana"), p("ana")] }, "repetidos"],
    ["rank out of range", { participants: [p("ana", null, 3), p("bruno")] }, "de 1 a 2"],
    ["bad duration", { durationMinutes: 0 }, "duración"],
    ["coop with ranks", { mode: "cooperative", participants: [p("ana", null, 1)] }, "cooperativa"],
    ["team with one team", { mode: "team", teams: [{ key: "a", name: "A", won: false }], participants: [p("ana", null, null, "a")] }, "dos equipos"],
    [
      "team member without team",
      {
        mode: "team",
        teams: [
          { key: "a", name: "A", won: true },
          { key: "b", name: "B", won: false },
        ],
        participants: [p("ana", null, null, "a"), p("bruno")],
      },
      "equipo",
    ],
    [
      "two winning teams",
      {
        mode: "team",
        teams: [
          { key: "a", name: "A", won: true },
          { key: "b", name: "B", won: true },
        ],
        participants: [p("ana", null, null, "a"), p("bruno", null, null, "b")],
      },
      "Solo puede ganar",
    ],
  ])("rejects %s", (_name, change, message) => {
    const result = validatePlay({ ...base, ...change });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
  });

  it("accepts a team Play", () => {
    const result = validatePlay({
      ...base,
      mode: "team",
      teams: [
        { key: "a", name: "Resistencia", won: true },
        { key: "b", name: "Espías", won: false },
      ],
      participants: [p("ana", null, null, "a"), p("bruno", null, null, "b")],
    });
    expect(result).toEqual({ ok: true });
  });
});

describe("durations", () => {
  it("formats", () => {
    expect(formatDuration(85)).toBe("1 h 25 min");
    expect(formatDuration(40)).toBe("40 min");
    expect(formatDuration(120)).toBe("2 h");
    expect(formatDuration(null)).toBeNull();
  });
});

describe("parsePlayInput and toSavePlayPayload", () => {
  it("computes the Ranking from Scores when saving, ignoring manual ranks", () => {
    const input = parsePlayInput({
      sessionId: "s",
      gameId: "g",
      mode: "competitive",
      participants: [
        { playerId: "ana", score: "12", rank: "2" },
        { playerId: "bruno", score: "7,5", rank: "1" },
      ],
      durationMinutes: "30",
      notes: "  ",
    })!;
    expect(input.participants[1]!.score).toBe(7.5);
    expect(input.notes).toBeNull();
    expect(validatePlay(input)).toEqual({ ok: true });

    const payload = toSavePlayPayload(input, true);
    expect(payload.participants).toEqual([
      { player_id: "ana", score: 12, rank: 2, team_key: null },
      { player_id: "bruno", score: 7.5, rank: 1, team_key: null },
    ]);
    expect(payload.duration_minutes).toBe(30);
  });

  it("drops fields that do not belong to the mode", () => {
    const input = parsePlayInput({
      sessionId: "s",
      gameId: "g",
      mode: "cooperative",
      coopWon: false,
      teams: [{ key: "a", name: "A" }],
      participants: [{ playerId: "ana", score: 3 }],
    })!;
    const payload = toSavePlayPayload(input, false);
    expect(payload.teams).toEqual([]);
    expect(payload.coop_won).toBe(false);
    expect(payload.participants[0]).toEqual({ player_id: "ana", score: null, rank: null, team_key: null });
  });

  it("turns garbage numbers into a validation error", () => {
    const input = parsePlayInput({ sessionId: "s", gameId: "g", mode: "competitive", participants: [{ playerId: "a", score: "abc" }] })!;
    expect(validatePlay(input).ok).toBe(false);
  });

  it("rejects unknown modes", () => expect(parsePlayInput({ mode: "solo" })).toBeNull());
});
