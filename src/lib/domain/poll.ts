import type { ParseResult } from "./game-form";
import { competitionRanks } from "./ranking";
import { GROUP_TIME_ZONE } from "./session";

export type PollState = { closesAt: string | null; closedAt: string | null };

/** A Poll is open until its creator closes it or its deadline passes. */
export function isPollOpen(poll: PollState, now: Date = new Date()): boolean {
  if (poll.closedAt) return false;
  return poll.closesAt === null || Date.parse(poll.closesAt) > now.getTime();
}

export type CandidateTally = {
  id: string;
  gameId: string;
  name: string;
  approvals: string[];
  chosen: boolean;
};

export type RankedCandidate = CandidateTally & { position: number; leading: boolean };

/**
 * Orientative ranking: most Approvals first, ties share a position. Every Candidate with the
 * top count is "leading" (there can be several winners, since an evening has room for several Games);
 * any Member breaks ties by marking them chosen.
 */
export function rankCandidates(candidates: CandidateTally[]): RankedCandidate[] {
  const sorted = [...candidates].sort((a, b) => b.approvals.length - a.approvals.length || a.name.localeCompare(b.name, "es"));
  const top = Math.max(0, ...sorted.map((c) => c.approvals.length));
  const positions = competitionRanks(sorted, (c) => c.approvals.length, (a, b) => b - a);
  return sorted.map((c) => ({ ...c, position: positions.get(c)!, leading: top > 0 && c.approvals.length === top }));
}

/** Whether someone still has to break a tie among the leaders. */
export function needsTieBreak(ranked: RankedCandidate[]): boolean {
  return ranked.filter((c) => c.leading).length > 1 && !ranked.some((c) => c.chosen);
}

/** Offset in minutes of the group's time zone at a given instant (e.g. 120 in summer). */
function zoneOffsetMinutes(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: GROUP_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** Converts a `datetime-local` value typed in the group's time zone to an ISO instant. */
export function localDateTimeToIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number) as [number, number, number, number, number, number];
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes handle the days when the offset changes.
  let instant = naive - zoneOffsetMinutes(new Date(naive)) * 60000;
  instant = naive - zoneOffsetMinutes(new Date(instant)) * 60000;
  return new Date(instant).toISOString();
}

/**
 * The latest deadline a Poll can have, as a local "YYYY-MM-DDTHH:MM": when its Session starts, or the end
 * of the Session's day when it has no time. The same format as the deadline input, so they compare as text.
 */
export function latestDeadline(sessionDate: string, startTime: string | null): string {
  return `${sessionDate}T${startTime ?? "23:59"}`;
}

/**
 * Validates a Poll's optional deadline, the `datetime-local` value typed in the group's time zone, and
 * returns it as an ISO instant (null without one). It must be in the future and not after `latest`
 * (see latestDeadline; null skips that check).
 */
export function parseDeadline(deadline: string, latest: string | null, now: Date = new Date()): ParseResult<string | null> {
  if (!deadline) return { ok: true, value: null };
  const closesAt = localDateTimeToIso(deadline);
  if (!closesAt) return { ok: false, error: "Fecha límite no válida." };
  if (Date.parse(closesAt) <= now.getTime()) return { ok: false, error: "La fecha límite tiene que ser futura." };
  if (latest !== null && deadline > latest) return { ok: false, error: "La fecha límite no puede ser posterior a la sesión." };
  return { ok: true, value: closesAt };
}

/** "viernes 23 oct, 20:00" in the group's time zone. */
export function formatDeadline(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: GROUP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date(iso))
    .replace(".", "");
}
