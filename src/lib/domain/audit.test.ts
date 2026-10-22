import { describe, expect, it } from "vitest";
import { AUDIT_KINDS, auditHref, describeAuditEntry, formatAuditTime, parseAuditKind } from "./audit";

describe("auditHref", () => {
  it("links each kind to the page that shows it", () => {
    expect(auditHref("game", "g1")).toBe("/games/g1");
    expect(auditHref("expansion", "g1")).toBe("/games/g1");
    expect(auditHref("rating", "g1")).toBe("/games/g1");
    expect(auditHref("attendee", "s1")).toBe("/sessions/s1");
    expect(auditHref("play", "p1")).toBe("/plays/p1");
    expect(auditHref("poll", "v1")).toBe("/polls/v1");
    expect(auditHref("photo", "f1")).toBe("/photos/f1");
  });

  it("sends Players and accesses to Admin, and links nowhere without a reference", () => {
    expect(auditHref("player", "x")).toBe("/admin");
    expect(auditHref("email", null)).toBe("/admin");
    expect(auditHref("game", null)).toBeNull();
  });

  it("covers every kind", () => {
    for (const kind of AUDIT_KINDS) expect(auditHref(kind, "id")).not.toBeNull();
  });
});

describe("parseAuditKind", () => {
  it("accepts a known kind and ignores anything else", () => {
    expect(parseAuditKind("play")).toBe("play");
    expect(parseAuditKind(["photo", "game"])).toBe("photo");
    expect(parseAuditKind("table")).toBeNull();
    expect(parseAuditKind(undefined)).toBeNull();
  });
});

describe("describeAuditEntry", () => {
  it("reads as a sentence after the author's name", () => {
    expect(describeAuditEntry("create", "play")).toBe("creó la partida");
    expect(describeAuditEntry("delete", "expansion")).toBe("eliminó la expansión");
    expect(describeAuditEntry("update", "rating")).toBe("modificó su valoración de");
  });
});

describe("formatAuditTime", () => {
  it("uses the group's time zone", () => {
    // 23:30 UTC on 24 October is 01:30 on 25 October in Madrid.
    expect(formatAuditTime("2026-10-24T23:30:00Z")).toMatch(/25 oct 2026.*01:30/);
  });
});
