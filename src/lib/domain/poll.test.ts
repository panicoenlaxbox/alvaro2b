import { describe, expect, it } from "vitest";
import { isPollOpen, latestDeadline, localDateTimeToIso, needsTieBreak, parseDeadline, rankCandidates, type CandidateTally } from "./poll";

const c = (name: string, approvals: string[], chosen = false): CandidateTally => ({ id: name, gameId: name, name, approvals, chosen });

describe("isPollOpen", () => {
  const now = new Date("2026-10-20T12:00:00Z");
  it("is open without deadline", () => expect(isPollOpen({ closesAt: null, closedAt: null }, now)).toBe(true));
  it("closes at the deadline", () => {
    expect(isPollOpen({ closesAt: "2026-10-20T13:00:00Z", closedAt: null }, now)).toBe(true);
    expect(isPollOpen({ closesAt: "2026-10-20T11:00:00Z", closedAt: null }, now)).toBe(false);
  });
  it("closes by hand", () => expect(isPollOpen({ closesAt: null, closedAt: "2026-10-19T10:00:00Z" }, now)).toBe(false));
});

describe("rankCandidates", () => {
  it("orders by Approvals with shared positions and several leaders", () => {
    const ranked = rankCandidates([c("Azul", ["a", "b"]), c("Catan", ["a"]), c("Wingspan", ["b", "c"])]);
    expect(ranked.map((r) => [r.name, r.position, r.leading])).toEqual([
      ["Azul", 1, true],
      ["Wingspan", 1, true],
      ["Catan", 3, false],
    ]);
    expect(needsTieBreak(ranked)).toBe(true);
  });

  it("has no leader without Approvals", () => {
    expect(rankCandidates([c("Azul", []), c("Catan", [])]).some((r) => r.leading)).toBe(false);
  });

  it("stops asking for a tie-break once someone chose", () => {
    expect(needsTieBreak(rankCandidates([c("Azul", ["a"], true), c("Catan", ["b"])]))).toBe(false);
  });
});

describe("localDateTimeToIso", () => {
  it("reads Madrid summer time (UTC+2)", () => expect(localDateTimeToIso("2026-10-20T20:00")).toBe("2026-10-20T18:00:00.000Z"));
  it("reads Madrid winter time (UTC+1)", () => expect(localDateTimeToIso("2026-11-20T20:00")).toBe("2026-11-20T19:00:00.000Z"));
  it("rejects other formats", () => expect(localDateTimeToIso("20/10/2026")).toBeNull());
});

describe("latestDeadline", () => {
  it("is the Session's start time", () => expect(latestDeadline("2026-10-24", "20:30")).toBe("2026-10-24T20:30"));
  it("is the end of the Session's day when it has no time", () => expect(latestDeadline("2026-10-24", null)).toBe("2026-10-24T23:59"));
});

describe("parseDeadline", () => {
  const now = new Date("2026-10-20T12:00:00Z");
  it("allows no deadline", () => expect(parseDeadline("", "2026-10-24T20:30", now)).toEqual({ ok: true, value: null }));
  it("returns the ISO instant", () => {
    expect(parseDeadline("2026-10-24T20:00", "2026-10-24T20:30", now)).toEqual({ ok: true, value: "2026-10-24T18:00:00.000Z" });
  });
  it("rejects a malformed value", () => {
    expect(parseDeadline("24/10/2026", null, now)).toEqual({ ok: false, error: "Fecha límite no válida." });
  });
  it("must be in the future", () => {
    expect(parseDeadline("2026-10-20T14:00", null, now)).toEqual({ ok: false, error: "La fecha límite tiene que ser futura." });
    expect(parseDeadline("2026-10-20T14:01", null, now).ok).toBe(true);
  });
  it("cannot be after the latest deadline", () => {
    expect(parseDeadline("2026-10-24T20:31", "2026-10-24T20:30", now)).toEqual({
      ok: false,
      error: "La fecha límite no puede ser posterior a la sesión.",
    });
    expect(parseDeadline("2026-10-24T20:30", "2026-10-24T20:30", now).ok).toBe(true);
  });
  it("skips the latest check without one", () => expect(parseDeadline("2027-01-01T10:00", null, now).ok).toBe(true));
});
