import type { ParseResult } from "./game-form";
import { formatShortDate, GROUP_TIME_ZONE, todayIso } from "./session";

/** Longest Player name, for Guests added and renamed by the Admin; the form inputs use it too. */
export const PLAYER_NAME_MAX = 60;

/** Validates a Player's name: trimmed, between 1 and PLAYER_NAME_MAX characters. */
export function parsePlayerName(value: string | null | undefined): ParseResult<string> {
  const name = (value ?? "").trim();
  if (name.length < 1 || name.length > PLAYER_NAME_MAX) return { ok: false, error: `Escribe un nombre (máximo ${PLAYER_NAME_MAX} caracteres).` };
  return { ok: true, value: name };
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** A loose email check for the allowlist form: something@domain.tld, no spaces. */
export function isValidEmail(email: string): boolean {
  return EMAIL.test(email);
}

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
