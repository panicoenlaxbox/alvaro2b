export const RSVP_RESPONSES = ["yes", "maybe", "no"] as const;
export type RsvpResponse = (typeof RSVP_RESPONSES)[number];

export const RSVP_LABELS: Record<RsvpResponse, string> = { yes: "Voy", maybe: "Quizá", no: "No voy" };

/** The group's time zone; it decides what "today" is (mirrors private.today() in SQL). */
export const GROUP_TIME_ZONE = "Europe/Madrid";

/** Today's date as YYYY-MM-DD in the group's time zone. */
export function todayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: GROUP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** A Session dated today or later is upcoming; an earlier one is past. Sessions have no status. */
export function isUpcoming(date: string, today: string): boolean {
  return date >= today;
}

export type SessionGroups<T> = { upcoming: T[]; past: T[] };

/** Groups Sessions for the list: upcoming soonest first, past newest first. */
export function groupSessions<T extends { date: string }>(sessions: T[], today: string): SessionGroups<T> {
  const upcoming = sessions.filter((s) => isUpcoming(s.date, today)).sort((a, b) => a.date.localeCompare(b.date));
  const past = sessions.filter((s) => !isUpcoming(s.date, today)).sort((a, b) => b.date.localeCompare(a.date));
  return { upcoming, past };
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
