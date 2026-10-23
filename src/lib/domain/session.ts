import type { ParseResult } from "./game-form";

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

/** Groups Sessions for the list: upcoming soonest first, past newest first, by date and then time (none goes first). */
export function groupSessions<T extends { date: string; time: string | null }>(sessions: T[], today: string): SessionGroups<T> {
  const when = (s: T) => `${s.date} ${s.time ?? ""}`;
  const upcoming = sessions.filter((s) => isUpcoming(s.date, today)).sort((a, b) => when(a).localeCompare(when(b)));
  const past = sessions.filter((s) => !isUpcoming(s.date, today)).sort((a, b) => when(b).localeCompare(when(a)));
  return { upcoming, past };
}

/** Longest text each Session field takes; the form's inputs use it too. */
export const SESSION_TEXT_LIMITS = { name: 60, place: 120, notes: 4000 } as const;

/** The pattern the time input accepts natively, the same shapes parseSessionTime reads. */
export const SESSION_TIME_PATTERN = String.raw`\d{1,2}([:.]?\d{2})?`;

/** A Session's optional start time in 24-hour format: "20:30", "2030", "20.30" or "20" give "20:30" / "20:00". */
export function parseSessionTime(text: string): string | null | "invalid" {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const match = /^(\d{1,2})(?:[:.]?(\d{2}))?$/.exec(trimmed);
  if (!match) return "invalid";
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  if (hours > 23 || minutes > 59) return "invalid";
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export type SessionInput = { date: string; start_time: string | null; name: string | null; place: string | null; notes: string | null };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Validates the Session form: a date, and optionally a start time, name, place and notes. */
export function parseSessionForm(values: Partial<Record<keyof SessionInput, string | null | undefined>>): ParseResult<SessionInput> {
  const date = values.date ?? "";
  if (!DATE.test(date) || Number.isNaN(Date.parse(date))) return { ok: false, error: "Elige una fecha." };
  const time = parseSessionTime(values.start_time ?? "");
  if (time === "invalid") return { ok: false, error: "La hora va en formato 24 horas, como 20:30." };
  const name = (values.name ?? "").trim();
  const place = (values.place ?? "").trim();
  const notes = (values.notes ?? "").trim();
  if (name.length > SESSION_TEXT_LIMITS.name) return { ok: false, error: "El nombre es demasiado largo." };
  if (place.length > SESSION_TEXT_LIMITS.place) return { ok: false, error: "El lugar es demasiado largo." };
  if (notes.length > SESSION_TEXT_LIMITS.notes) return { ok: false, error: "Las notas son demasiado largas." };
  return { ok: true, value: { date, start_time: time, name: name || null, place: place || null, notes: notes || null } };
}

/** "20:30" from the database's "20:30:00". */
export function formatSessionTime(time: string | null): string | null {
  return time ? time.slice(0, 5) : null;
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
