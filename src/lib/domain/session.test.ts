import { describe, expect, it } from "vitest";
import { formatSessionDate, formatSessionTime, formatShortDate, groupSessions, isUpcoming, parseSessionTime, todayIso } from "./session";

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
