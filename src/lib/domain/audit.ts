import { GROUP_TIME_ZONE } from "./session";

export const AUDIT_KINDS = ["game", "expansion", "rating", "attachment", "session", "attendee", "play", "poll", "photo", "player", "email"] as const;
export type AuditKind = (typeof AUDIT_KINDS)[number];
export type AuditAction = "create" | "update" | "delete";

/** The kind filter's options, plural. */
export const AUDIT_KIND_LABELS: Record<AuditKind, string> = {
  game: "Juegos",
  expansion: "Expansiones",
  rating: "Valoraciones",
  attachment: "Ficheros",
  session: "Sesiones",
  attendee: "Asistencia",
  play: "Partidas",
  poll: "Votaciones",
  photo: "Fotos",
  player: "Jugadores",
  email: "Accesos",
};

/** What an entry did, as "creó la partida". */
export function describeAuditEntry(action: AuditAction, kind: AuditKind): string {
  const verb = { create: "creó", update: "modificó", delete: "eliminó" }[action];
  const noun: Record<AuditKind, string> = {
    game: "el juego",
    expansion: "la expansión",
    rating: "su valoración de",
    attachment: "el fichero de",
    session: "la sesión",
    attendee: "la asistencia de",
    play: "la partida",
    poll: "la votación",
    photo: "la foto",
    player: "el jugador",
    email: "el acceso de",
  };
  return `${verb} ${noun[kind]}`;
}

/** The table that must still hold `ref_id` for an entry to link to its page; Players link to Admin. */
export type AuditRefTable = "games" | "sessions" | "plays" | "polls" | "photos";

export function auditRefTable(kind: AuditKind): AuditRefTable | null {
  switch (kind) {
    case "game":
    case "expansion":
    case "rating":
    case "attachment":
      return "games";
    case "session":
    case "attendee":
      return "sessions";
    case "play":
      return "plays";
    case "poll":
      return "polls";
    case "photo":
      return "photos";
    case "player":
    case "email":
      return null;
  }
}

/** The page that shows an entry, or null when it points to nothing. */
export function auditHref(kind: AuditKind, refId: string | null): string | null {
  const table = auditRefTable(kind);
  if (table === null) return "/admin";
  return refId ? `/${table}/${refId}` : null;
}

/** Reads a `?kind=` search param; anything else is no filter. */
export function parseAuditKind(value: string | string[] | undefined): AuditKind | null {
  const v = Array.isArray(value) ? value[0] : value;
  return (AUDIT_KINDS as readonly string[]).includes(v ?? "") ? (v as AuditKind) : null;
}

/** "22 oct 2026, 18:05", in the group's time zone. */
export function formatAuditTime(timestamp: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: GROUP_TIME_ZONE }).format(
    new Date(timestamp),
  );
}
