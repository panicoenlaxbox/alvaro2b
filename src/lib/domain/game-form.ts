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

/** Longest text each Game and Expansion field takes; the form inputs use it too. */
export const GAME_TEXT_LIMITS = { name: 120, notes: 4000 } as const;

/** Accepted range of each numeric Game field; the form's inputs use it too. */
export const GAME_NUMBER_LIMITS = {
  year: { min: 1800, max: 2100 },
  min_players: { min: 1, max: 100 },
  max_players: { min: 1, max: 100 },
  min_duration: { min: 1, max: 6000 },
  max_duration: { min: 1, max: 6000 },
  complexity: { min: 1, max: 5 },
  bgg_id: { min: 1, max: 2_000_000_000 },
} as const;

function optionalNumber(value: Field, label: string, min: number, max: number, decimals = false): number | null | string {
  const text = (value ?? "").toString().trim().replace(",", ".");
  if (text === "") return null;
  const n = Number(text);
  if (!Number.isFinite(n) || (!decimals && !Number.isInteger(n)) || n < min || n > max) {
    return `${label}: debe ser un número entre ${min} y ${max}.`;
  }
  return decimals ? Math.round(n * 10) / 10 : n;
}

const BGG_PAGE = /^(?:https?:\/\/)?(?:www\.)?boardgamegeek\.com\/[a-z]+\/(\d+)(?:[/?#].*)?$/i;

/** The BGG id from the address of a Game's or Expansion's BGG page (a bare id still works). */
function bggIdFromPage(value: Field): number | null | string {
  const text = (value ?? "").toString().trim();
  if (text === "") return null;
  const id = Number(/^\d+$/.test(text) ? text : (BGG_PAGE.exec(text)?.[1] ?? NaN));
  if (!Number.isInteger(id) || id < GAME_NUMBER_LIMITS.bgg_id.min || id > GAME_NUMBER_LIMITS.bgg_id.max) {
    return "Página de BGG: pega la dirección de la ficha del juego, como https://boardgamegeek.com/boardgame/174430/gloomhaven.";
  }
  return id;
}

export function bggPageUrl(id: number, kind: "game" | "expansion" = "game"): string {
  return `https://boardgamegeek.com/${kind === "expansion" ? "boardgameexpansion" : "boardgame"}/${id}`;
}

export type ExpansionInput = { name: string; bgg_id: number | null };

/** Validates the Expansion form: a name and, optionally, its BGG page. */
export function parseExpansionForm(values: Partial<Record<keyof ExpansionInput, Field>>): ParseResult<ExpansionInput> {
  const name = (values.name ?? "").trim();
  if (name.length < 1 || name.length > GAME_TEXT_LIMITS.name) {
    return { ok: false, error: `Escribe el nombre de la expansión (máximo ${GAME_TEXT_LIMITS.name} caracteres).` };
  }
  const bgg_id = bggIdFromPage(values.bgg_id);
  if (typeof bgg_id === "string") return { ok: false, error: bgg_id };
  return { ok: true, value: { name, bgg_id } };
}

/** Validates the Game form. Every field except the name is optional (fast logging). */
export function parseGameForm(values: GameFormValues): ParseResult<GameInput> {
  const name = (values.name ?? "").trim();
  if (name.length < 1 || name.length > GAME_TEXT_LIMITS.name) {
    return { ok: false, error: `El nombre es obligatorio (máximo ${GAME_TEXT_LIMITS.name} caracteres).` };
  }

  const L = GAME_NUMBER_LIMITS;
  const numbers = {
    year: optionalNumber(values.year, "Año", L.year.min, L.year.max),
    min_players: optionalNumber(values.min_players, "Mínimo de jugadores", L.min_players.min, L.min_players.max),
    max_players: optionalNumber(values.max_players, "Máximo de jugadores", L.max_players.min, L.max_players.max),
    min_duration: optionalNumber(values.min_duration, "Duración mínima", L.min_duration.min, L.min_duration.max),
    max_duration: optionalNumber(values.max_duration, "Duración máxima", L.max_duration.min, L.max_duration.max),
    complexity: optionalNumber(values.complexity, "Complejidad", L.complexity.min, L.complexity.max, true),
    bgg_id: bggIdFromPage(values.bgg_id),
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
  if (notes.length > GAME_TEXT_LIMITS.notes) return { ok: false, error: "Las notas son demasiado largas." };

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
