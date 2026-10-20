export const SESSION_STATUSES = ["planned", "held", "cancelled"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  planned: "Planificada",
  held: "Celebrada",
  cancelled: "Cancelada",
};

export const RSVP_RESPONSES = ["yes", "maybe", "no"] as const;
export type RsvpResponse = (typeof RSVP_RESPONSES)[number];

export const RSVP_LABELS: Record<RsvpResponse, string> = { yes: "Voy", maybe: "Quizá", no: "No voy" };

/** The group's time zone; it decides what "today" is (mirrors private.today() in SQL). */
export const GROUP_TIME_ZONE = "Europe/Madrid";

/** Today's date as YYYY-MM-DD in the group's time zone. */
export function todayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: GROUP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** A Session dated today or earlier is born held; a future one is born planned. */
export function initialStatus(date: string, today: string): SessionStatus {
  return date > today ? "planned" : "held";
}

/** Only a planned Session can be cancelled or started by hand. */
export function canCancel(status: SessionStatus): boolean {
  return status === "planned";
}

export function canStart(status: SessionStatus): boolean {
  return status === "planned";
}

/** A planned Session whose date has passed without Plays waits for someone to log or cancel it. */
export function isPendingClose(session: { status: SessionStatus; date: string; playCount: number }, today: string): boolean {
  return session.status === "planned" && session.date < today && session.playCount === 0;
}

export type SessionGroups<T> = { pendingClose: T[]; upcoming: T[]; held: T[]; cancelled: T[] };

/** Groups Sessions for the list: pending first, upcoming soonest first, the rest newest first. */
export function groupSessions<T extends { status: SessionStatus; date: string; playCount: number }>(
  sessions: T[],
  today: string,
): SessionGroups<T> {
  const groups: SessionGroups<T> = { pendingClose: [], upcoming: [], held: [], cancelled: [] };
  for (const s of sessions) {
    if (isPendingClose(s, today)) groups.pendingClose.push(s);
    else if (s.status === "planned") groups.upcoming.push(s);
    else if (s.status === "held") groups.held.push(s);
    else groups.cancelled.push(s);
  }
  const asc = (a: T, b: T) => a.date.localeCompare(b.date);
  const desc = (a: T, b: T) => b.date.localeCompare(a.date);
  groups.pendingClose.sort(asc);
  groups.upcoming.sort(asc);
  groups.held.sort(desc);
  groups.cancelled.sort(desc);
  return groups;
}

/** "sábado, 24 de octubre de 2026" */
export function formatSessionDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y!, m! - 1, d!)),
  );
}

/** "10 oct 2026" */
export function formatShortDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(y!, m! - 1, d!)))
    .replace(".", "");
}
