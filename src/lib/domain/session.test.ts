import { describe, expect, it } from "vitest";
import { formatSessionDate, formatSessionTime, formatShortDate, groupSessions, isUpcoming, parseSessionForm, parseSessionTime, SESSION_TEXT_LIMITS, todayIso } from "./session";

describe("todayIso", () => {
  it("uses the group's time zone, not UTC", () => {
    // 23:30 UTC on 24 October is already 25 October in Madrid (UTC+2 in summer time).
    expect(todayIso(new Date("2026-10-24T23:30:00Z"))).toBe("2026-10-25");
    expect(todayIso(new Date("2026-10-24T12:00:00Z"))).toBe("2026-10-24");
  });
});

describe("isUpcoming", () => {
  it("is true for today or a future date, false for the past", () => {
    expect(isUpcoming("2026-10-20", "2026-10-20")).toBe(true);
    expect(isUpcoming("2026-10-21", "2026-10-20")).toBe(true);
    expect(isUpcoming("2026-10-19", "2026-10-20")).toBe(false);
  });
});

describe("groupSessions", () => {
  it("splits upcoming, soonest first, from past, newest first, by date and then time", () => {
    const s = (id: string, date: string, time: string | null = null) => ({ id, date, time });
    const groups = groupSessions(
      [
        s("old", "2026-09-01"),
        s("recent-early", "2026-10-15", "10:00"),
        s("recent-late", "2026-10-15", "21:00"),
        s("next", "2026-10-24"),
        s("today-late", "2026-10-20", "21:00"),
        s("today-early", "2026-10-20", "17:30"),
        s("soon", "2026-10-21"),
      ],
      "2026-10-20",
    );
    expect(groups.upcoming.map((x) => x.id)).toEqual(["today-early", "today-late", "soon", "next"]);
    expect(groups.past.map((x) => x.id)).toEqual(["recent-late", "recent-early", "old"]);
  });
});

describe("parseSessionTime", () => {
  it.each([
    ["20:30", "20:30"],
    ["9:05", "09:05"],
    ["2030", "20:30"],
    ["20.30", "20:30"],
    ["20", "20:00"],
    [" 7 ", "07:00"],
    ["00:00", "00:00"],
  ])("reads %o as %o", (text, expected) => expect(parseSessionTime(text)).toBe(expected));

  it("is empty for no time", () => expect(parseSessionTime("  ")).toBeNull());

  it.each(["24:00", "20:60", "8pm", "20:3", "abc"])("rejects %o", (text) => expect(parseSessionTime(text)).toBe("invalid"));
});

describe("formatSessionTime", () => {
  it("drops the seconds the database adds", () => expect(formatSessionTime("20:30:00")).toBe("20:30"));
  it("is null without a time", () => expect(formatSessionTime(null)).toBeNull());
});

describe("formatSessionDate", () => {
  it("formats in Spanish", () => expect(formatSessionDate("2026-10-24")).toBe("sábado, 24 de octubre de 2026"));
});

describe("formatShortDate", () => {
  it("formats compactly in Spanish", () => expect(formatShortDate("2026-10-10")).toBe("10 oct 2026"));
});

describe("parseSessionForm", () => {
  it("trims the fields and turns blanks into null", () => {
    expect(parseSessionForm({ date: "2026-10-24", start_time: "2030", name: "  Noche  ", place: " ", notes: "" })).toEqual({
      ok: true,
      value: { date: "2026-10-24", start_time: "20:30", name: "Noche", place: null, notes: null },
    });
  });

  it("only needs a date", () => {
    expect(parseSessionForm({ date: "2026-10-24" })).toEqual({
      ok: true,
      value: { date: "2026-10-24", start_time: null, name: null, place: null, notes: null },
    });
  });

  it("requires a valid date", () => {
    for (const date of [undefined, null, "", "24/10/2026", "2026-13-45"]) {
      expect(parseSessionForm({ date })).toEqual({ ok: false, error: "Elige una fecha." });
    }
  });

  it("rejects a bad time", () => {
    expect(parseSessionForm({ date: "2026-10-24", start_time: "25:00" })).toEqual({
      ok: false,
      error: "La hora va en formato 24 horas, como 20:30.",
    });
  });

  it("limits the text fields", () => {
    const date = "2026-10-24";
    const long = (n: number) => "x".repeat(n + 1);
    expect(parseSessionForm({ date, name: long(SESSION_TEXT_LIMITS.name) })).toEqual({ ok: false, error: "El nombre es demasiado largo." });
    expect(parseSessionForm({ date, place: long(SESSION_TEXT_LIMITS.place) })).toEqual({ ok: false, error: "El lugar es demasiado largo." });
    expect(parseSessionForm({ date, notes: long(SESSION_TEXT_LIMITS.notes) })).toEqual({ ok: false, error: "Las notas son demasiado largas." });
    expect(parseSessionForm({ date, name: "x".repeat(SESSION_TEXT_LIMITS.name) }).ok).toBe(true);
  });
});
