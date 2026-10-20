import { describe, expect, it } from "vitest";
import { canCancel, formatSessionDate, formatShortDate, groupSessions, initialStatus, isPendingClose, todayIso } from "./session";

describe("todayIso", () => {
  it("uses the group's time zone, not UTC", () => {
    // 23:30 UTC on 24 October is already 25 October in Madrid (UTC+2 in summer time).
    expect(todayIso(new Date("2026-10-24T23:30:00Z"))).toBe("2026-10-25");
    expect(todayIso(new Date("2026-10-24T12:00:00Z"))).toBe("2026-10-24");
  });
});

describe("initialStatus", () => {
  it("is held for today or the past", () => {
    expect(initialStatus("2026-10-20", "2026-10-20")).toBe("held");
    expect(initialStatus("2026-01-01", "2026-10-20")).toBe("held");
  });
  it("is planned for a future date", () => expect(initialStatus("2026-10-21", "2026-10-20")).toBe("planned"));
});

describe("lifecycle rules", () => {
  it("only cancels planned Sessions", () => {
    expect(canCancel("planned")).toBe(true);
    expect(canCancel("held")).toBe(false);
    expect(canCancel("cancelled")).toBe(false);
  });

  it("flags planned Sessions in the past without Plays as pending close", () => {
    const today = "2026-10-20";
    expect(isPendingClose({ status: "planned", date: "2026-10-19", playCount: 0 }, today)).toBe(true);
    expect(isPendingClose({ status: "planned", date: "2026-10-20", playCount: 0 }, today)).toBe(false);
    expect(isPendingClose({ status: "planned", date: "2026-10-19", playCount: 1 }, today)).toBe(false);
    expect(isPendingClose({ status: "held", date: "2026-10-19", playCount: 0 }, today)).toBe(false);
  });
});

describe("groupSessions", () => {
  it("groups and orders Sessions", () => {
    const s = (id: string, status: "planned" | "held" | "cancelled", date: string, playCount = 0) => ({ id, status, date, playCount });
    const groups = groupSessions(
      [
        s("old-held", "held", "2026-09-01", 2),
        s("new-held", "held", "2026-10-10", 1),
        s("pending", "planned", "2026-10-15"),
        s("next", "planned", "2026-10-24"),
        s("soon", "planned", "2026-10-21"),
        s("off", "cancelled", "2026-10-01"),
      ],
      "2026-10-20",
    );
    expect(groups.pendingClose.map((x) => x.id)).toEqual(["pending"]);
    expect(groups.upcoming.map((x) => x.id)).toEqual(["soon", "next"]);
    expect(groups.held.map((x) => x.id)).toEqual(["new-held", "old-held"]);
    expect(groups.cancelled.map((x) => x.id)).toEqual(["off"]);
  });
});

describe("formatSessionDate", () => {
  it("formats in Spanish", () => expect(formatSessionDate("2026-10-24")).toBe("sábado, 24 de octubre de 2026"));
});

describe("formatShortDate", () => {
  it("formats compactly in Spanish", () => expect(formatShortDate("2026-10-10")).toBe("10 oct 2026"));
});
