import { formatShortDate, GROUP_TIME_ZONE, todayIso } from "./session";

/** Longest Player name, for Guests added and renamed by the Admin; the form inputs use it too. */
export const PLAYER_NAME_MAX = 60;

/** When a Member last connected, in the group's time zone: "hoy, 18:42", "ayer, 21:10" or "10 oct 2026". */
export function formatLastSeen(iso: string, now: Date = new Date()): string {
  const seen = new Date(iso);
  const day = todayIso(seen);
  const today = todayIso(now);
  // Noon of the day before, so a 23- or 25-hour day around a clock change cannot skip it.
  const [y, m, d] = today.split("-").map(Number);
  const yesterday = new Date(Date.UTC(y!, m! - 1, d! - 1, 12));
  const time = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: GROUP_TIME_ZONE }).format(seen);
  if (day === today) return `hoy, ${time}`;
  if (day === todayIso(yesterday)) return `ayer, ${time}`;
  return formatShortDate(day);
}
