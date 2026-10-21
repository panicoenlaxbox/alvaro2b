import { describe, expect, it } from "vitest";
import { durationText, parseGameForm, parseOwnerIds, playersText } from "./game-form";

describe("parseGameForm", () => {
  it("only requires a name", () => {
    const result = parseGameForm({ name: "  Azul  " });
    expect(result).toEqual({
      ok: true,
      value: {
        name: "Azul",
        year: null,
        min_players: null,
        max_players: null,
        min_duration: null,
        max_duration: null,
        complexity: null,
        default_play_mode: "competitive",
        lower_score_wins: false,
        bgg_id: null,
        notes: null,
      },
    });
  });

  it("parses numbers, decimal commas and checkboxes", () => {
    const result = parseGameForm({
      name: "Golf",
      min_players: "2",
      max_players: "6",
      complexity: "2,35",
      default_play_mode: "cooperative",
      lower_score_wins: "on",
    });
    expect(result.ok && result.value).toMatchObject({
      min_players: 2,
      max_players: 6,
      complexity: 2.4,
      default_play_mode: "cooperative",
      lower_score_wins: true,
    });
  });

  it.each([
    [{ name: "" }, "El nombre es obligatorio"],
    [{ name: "X", min_players: "4", max_players: "2" }, "máximo de jugadores"],
    [{ name: "X", min_duration: "90", max_duration: "30" }, "duración máxima"],
    [{ name: "X", complexity: "6" }, "Complejidad"],
    [{ name: "X", year: "1999.5" }, "Año"],
    [{ name: "X", default_play_mode: "solo" }, "Modo"],
  ])("rejects %o", (values, message) => {
    const result = parseGameForm(values);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
  });
});

describe("playersText and durationText", () => {
  it("formats ranges", () => {
    expect(playersText(2, 4)).toBe("2–4 jugadores");
    expect(playersText(3, 3)).toBe("3 jugadores");
    expect(playersText(2, null)).toBe("2+ jugadores");
    expect(playersText(null, null)).toBeNull();
    expect(durationText(30, 60)).toBe("30–60 min");
    expect(durationText(null, 45)).toBe("45 min");
  });
});

describe("parseOwnerIds", () => {
  it("keeps distinct, non-empty ids", () => expect(parseOwnerIds(["p1", " p2 ", "", "p1"])).toEqual(["p1", "p2"]));
  it("ignores files and other values", () => expect(parseOwnerIds([new Blob(), "p1"])).toEqual(["p1"]));
  it("allows no owner", () => expect(parseOwnerIds([])).toEqual([]));
});
