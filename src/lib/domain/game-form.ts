export const PLAY_MODES = ["competitive", "cooperative", "team"] as const;
export type PlayMode = (typeof PLAY_MODES)[number];

export const PLAY_MODE_LABELS: Record<PlayMode, string> = {
  competitive: "Competitivo",
  cooperative: "Cooperativo",
  team: "Por equipos",
};

export type GameInput = {
  name: string;
  year: number | null;
  min_players: number | null;
  max_players: number | null;
  min_duration: number | null;
  max_duration: number | null;
  complexity: number | null;
  default_play_mode: PlayMode;
  lower_score_wins: boolean;
  bgg_id: number | null;
  notes: string | null;
};

type Field = string | null | undefined;
export type GameFormValues = Partial<Record<keyof GameInput, Field>>;

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function optionalNumber(value: Field, label: string, min: number, max: number, decimals = false): number | null | string {
  const text = (value ?? "").toString().trim().replace(",", ".");
  if (text === "") return null;
  const n = Number(text);
  if (!Number.isFinite(n) || (!decimals && !Number.isInteger(n)) || n < min || n > max) {
    return `${label}: debe ser un número entre ${min} y ${max}.`;
  }
  return decimals ? Math.round(n * 10) / 10 : n;
}

/** Validates the Game form. Every field except the name is optional (fast logging, PRD). */
export function parseGameForm(values: GameFormValues): ParseResult<GameInput> {
  const name = (values.name ?? "").trim();
  if (name.length < 1 || name.length > 120) return { ok: false, error: "El nombre es obligatorio (máximo 120 caracteres)." };

  const numbers = {
    year: optionalNumber(values.year, "Año", 1800, 2100),
    min_players: optionalNumber(values.min_players, "Mínimo de jugadores", 1, 100),
    max_players: optionalNumber(values.max_players, "Máximo de jugadores", 1, 100),
    min_duration: optionalNumber(values.min_duration, "Duración mínima", 1, 6000),
    max_duration: optionalNumber(values.max_duration, "Duración máxima", 1, 6000),
    complexity: optionalNumber(values.complexity, "Complejidad", 1, 5, true),
    bgg_id: optionalNumber(values.bgg_id, "Id de BGG", 1, 2_000_000_000),
  };
  for (const v of Object.values(numbers)) if (typeof v === "string") return { ok: false, error: v };
  const n = numbers as Record<keyof typeof numbers, number | null>;

  if (n.min_players !== null && n.max_players !== null && n.max_players < n.min_players) {
    return { ok: false, error: "El máximo de jugadores no puede ser menor que el mínimo." };
  }
  if (n.min_duration !== null && n.max_duration !== null && n.max_duration < n.min_duration) {
    return { ok: false, error: "La duración máxima no puede ser menor que la mínima." };
  }

  const mode = (values.default_play_mode ?? "competitive") as PlayMode;
  if (!PLAY_MODES.includes(mode)) return { ok: false, error: "Modo de juego no válido." };

  const notes = (values.notes ?? "").trim();
  if (notes.length > 4000) return { ok: false, error: "Las notas son demasiado largas." };

  return {
    ok: true,
    value: {
      name,
      ...n,
      default_play_mode: mode,
      lower_score_wins: values.lower_score_wins === "on" || values.lower_score_wins === "true",
      notes: notes || null,
    },
  };
}

/** "2–4 jugadores", "3 jugadores" or null. */
export function playersText(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  if (min !== null && max !== null) return min === max ? `${min} jugadores` : `${min}–${max} jugadores`;
  return min !== null ? `${min}+ jugadores` : `hasta ${max} jugadores`;
}

/** "30–60 min", "45 min" or null. */
export function durationText(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  if (min !== null && max !== null) return min === max ? `${min} min` : `${min}–${max} min`;
  return `${min ?? max} min`;
}

/** The owners picked in a form (several checkboxes with the same name): distinct ids, blanks dropped. */
export function parseOwnerIds(values: unknown[]): string[] {
  return [...new Set(values.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean))];
}
