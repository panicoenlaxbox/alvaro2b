import { describe, expect, it } from "vitest";
import { formatLastSeen, isValidEmail, parsePlayerName, PLAYER_NAME_MAX } from "./players";

describe("formatLastSeen", () => {
  const now = new Date("2026-10-22T10:00:00Z"); // 12:00 in Madrid

  it("shows the time for today and yesterday in the group's time zone", () => {
    expect(formatLastSeen("2026-10-22T07:05:00Z", now)).toBe("hoy, 09:05");
    expect(formatLastSeen("2026-10-21T19:30:00Z", now)).toBe("ayer, 21:30");
  });

  it("counts the day in Madrid, not UTC", () => {
    // 22:30 UTC on 20 October is already 21 October in Madrid.
    expect(formatLastSeen("2026-10-20T22:30:00Z", now)).toBe("ayer, 00:30");
  });

  it("still finds yesterday right after a 23-hour day", () => {
    // Clocks went forward on 28 March 2027: 00:30 on the 29th in Madrid is 22:30 UTC on the 28th.
    expect(formatLastSeen("2027-03-28T10:00:00Z", new Date("2027-03-28T22:30:00Z"))).toBe("ayer, 12:00");
  });

  it("shows only the date for older connections", () => {
    expect(formatLastSeen("2026-10-10T12:00:00Z", now)).toBe("10 oct 2026");
  });
});

describe("parsePlayerName", () => {
  it("trims the name", () => expect(parsePlayerName("  Ana  ")).toEqual({ ok: true, value: "Ana" }));

  it("rejects blank and too long names", () => {
    const error = { ok: false, error: "Escribe un nombre (máximo 60 caracteres)." };
    expect(parsePlayerName(null)).toEqual(error);
    expect(parsePlayerName("   ")).toEqual(error);
    expect(parsePlayerName("x".repeat(PLAYER_NAME_MAX + 1))).toEqual(error);
    expect(parsePlayerName("x".repeat(PLAYER_NAME_MAX)).ok).toBe(true);
  });
});

describe("isValidEmail", () => {
  it("accepts a plain address", () => expect(isValidEmail("ana@example.com")).toBe(true));
  it("rejects malformed ones", () => {
    for (const email of ["", "ana", "ana@example", "ana @example.com", "@example.com", "ana@@example.com"]) {
      expect(isValidEmail(email)).toBe(false);
    }
  });
});
