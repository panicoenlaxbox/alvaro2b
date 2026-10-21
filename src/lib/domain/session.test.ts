import { describe, expect, it } from "vitest";
import { formatSessionDate, formatShortDate, groupSessions, isUpcoming, todayIso } from "./session";

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
  it("splits upcoming, soonest first, from past, newest first", () => {
    const s = (id: string, date: string) => ({ id, date });
    const groups = groupSessions(
      [s("old", "2026-09-01"), s("recent", "2026-10-15"), s("next", "2026-10-24"), s("today", "2026-10-20"), s("soon", "2026-10-21")],
      "2026-10-20",
    );
    expect(groups.upcoming.map((x) => x.id)).toEqual(["today", "soon", "next"]);
    expect(groups.past.map((x) => x.id)).toEqual(["recent", "old"]);
  });
});

describe("formatSessionDate", () => {
  it("formats in Spanish", () => expect(formatSessionDate("2026-10-24")).toBe("sábado, 24 de octubre de 2026"));
});

describe("formatShortDate", () => {
  it("formats compactly in Spanish", () => expect(formatShortDate("2026-10-10")).toBe("10 oct 2026"));
});
