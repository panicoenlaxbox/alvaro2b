import type { PlayMode } from "./game-form";

export type ParticipantInput = {
  playerId: string;
  score: number | null;
  /** Rank marked by hand; only used when not every Participant has a Score. */
  rank: number | null;
  teamKey: string | null;
};

export type TeamInput = { key: string; name: string; won: boolean };

export type PlayInput = {
  id?: string;
  sessionId: string;
  gameId: string;
  mode: PlayMode;
  expansionIds: string[];
  participants: ParticipantInput[];
  teams: TeamInput[];
  coopWon: boolean | null;
  durationMinutes: number | null;
  notes: string | null;
};

/**
 * Standard competition ranking ("1224"): tied values share a position and the next position
 * skips accordingly. `better(a, b)` is negative when a ranks above b.
 */
function competitionRanks<T>(items: T[], value: (item: T) => number, better: (a: number, b: number) => number): Map<T, number> {
  const sorted = [...items].sort((a, b) => better(value(a), value(b)));
  const ranks = new Map<T, number>();
  sorted.forEach((item, i) => {
    const prev = sorted[i - 1];
    ranks.set(item, prev !== undefined && value(prev) === value(item) ? ranks.get(prev)! : i + 1);
  });
  return ranks;
}

/**
 * Ranking of a competitive Play (ADR 0003). With a Score for every Participant it comes from the
 * Scores (lower first when the Game says "lower score wins"); otherwise from the ranks marked by
 * hand, normalized the same way. Ties are allowed. Participants without a manual rank stay unranked.
 */
export function computeRanking(participants: ParticipantInput[], lowerScoreWins: boolean): Map<string, number | null> {
  const result = new Map<string, number | null>(participants.map((p) => [p.playerId, null]));
  if (participants.length === 0) return result;

  const allScored = participants.every((p) => p.score !== null);
  if (allScored) {
    const ranks = competitionRanks(participants, (p) => p.score!, (a, b) => (lowerScoreWins ? a - b : b - a));
    for (const [p, rank] of ranks) result.set(p.playerId, rank);
    return result;
  }

  const ranked = participants.filter((p) => p.rank !== null);
  const ranks = competitionRanks(ranked, (p) => p.rank!, (a, b) => a - b);
  for (const [p, rank] of ranks) result.set(p.playerId, rank);
  return result;
}

/** The Participants who won a Play, whatever its mode. */
export function winnersOf(play: {
  mode: PlayMode;
  coopWon: boolean | null;
  participants: { playerId: string; rank: number | null; teamId: string | null }[];
  teams: { id: string; won: boolean }[];
}): string[] {
  switch (play.mode) {
    case "competitive":
      return play.participants.filter((p) => p.rank === 1).map((p) => p.playerId);
    case "cooperative":
      return play.coopWon ? play.participants.map((p) => p.playerId) : [];
    case "team": {
      const winning = new Set(play.teams.filter((t) => t.won).map((t) => t.id));
      return play.participants.filter((p) => p.teamId !== null && winning.has(p.teamId)).map((p) => p.playerId);
    }
  }
}

export type ValidationResult = { ok: true } | { ok: false; error: string };

/** Limits of the Play fields; the form inputs use them too. */
export const PLAY_LIMITS = { duration: { min: 1, max: 6000 }, notes: 4000, teamName: 60 } as const;

/** Checks a Play before saving. Results are optional, but when present they must fit the mode. */
export function validatePlay(play: PlayInput): ValidationResult {
  if (!play.gameId) return { ok: false, error: "Elige el juego." };
  if (play.participants.length === 0) return { ok: false, error: "Añade al menos un participante." };
  if (new Set(play.participants.map((p) => p.playerId)).size !== play.participants.length) {
    return { ok: false, error: "Hay participantes repetidos." };
  }
  const { min, max } = PLAY_LIMITS.duration;
  if (play.durationMinutes !== null && (!Number.isInteger(play.durationMinutes) || play.durationMinutes < min || play.durationMinutes > max)) {
    return { ok: false, error: `La duración debe estar entre ${min} y ${max} minutos.` };
  }
  if (play.notes !== null && play.notes.length > PLAY_LIMITS.notes) return { ok: false, error: "Las notas son demasiado largas." };

  const n = play.participants.length;
  switch (play.mode) {
    case "competitive":
      if (play.teams.length || play.coopWon !== null) return { ok: false, error: "Una partida competitiva no tiene equipos." };
      for (const p of play.participants) {
        if (p.rank !== null && (!Number.isInteger(p.rank) || p.rank < 1 || p.rank > n)) {
          return { ok: false, error: `Las posiciones van de 1 a ${n}.` };
        }
        if (p.score !== null && !Number.isFinite(p.score)) return { ok: false, error: "Puntuación no válida." };
      }
      return { ok: true };
    case "cooperative":
      if (play.teams.length || play.participants.some((p) => p.score !== null || p.rank !== null || p.teamKey !== null)) {
        return { ok: false, error: "En una partida cooperativa no hay posiciones ni equipos." };
      }
      return { ok: true };
    case "team": {
      if (play.coopWon !== null) return { ok: false, error: "Resultado no válido para una partida por equipos." };
      if (play.teams.length < 2) return { ok: false, error: "Una partida por equipos necesita al menos dos equipos." };
      const keys = new Set(play.teams.map((t) => t.key));
      if (play.teams.some((t) => !t.name.trim() || t.name.length > PLAY_LIMITS.teamName)) return { ok: false, error: "Pon nombre a cada equipo." };
      if (play.participants.some((p) => p.teamKey === null || !keys.has(p.teamKey))) {
        return { ok: false, error: "Cada participante tiene que estar en un equipo." };
      }
      if (play.participants.some((p) => p.score !== null || p.rank !== null)) {
        return { ok: false, error: "En una partida por equipos no hay posiciones individuales." };
      }
      if (play.teams.filter((t) => t.won).length > 1) return { ok: false, error: "Solo puede ganar un equipo." };
      return { ok: true };
    }
  }
}

/** "1 h 25 min", "40 min". */
export function formatDuration(minutes: number | null): string | null {
  if (minutes === null) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** "1.º", "2.º"… */
export function ordinal(rank: number): string {
  return `${rank}.º`;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

/** Parses the JSON sent by the Play form. Anything malformed becomes a validation error later. */
export function parsePlayInput(raw: unknown): PlayInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const mode = r.mode;
  if (mode !== "competitive" && mode !== "cooperative" && mode !== "team") return null;
  const list = (v: unknown) => (Array.isArray(v) ? v : []);

  return {
    id: str(r.id) ?? undefined,
    sessionId: str(r.sessionId) ?? "",
    gameId: str(r.gameId) ?? "",
    mode,
    expansionIds: list(r.expansionIds).filter((e): e is string => typeof e === "string"),
    participants: list(r.participants).map((p) => {
      const q = (p ?? {}) as Record<string, unknown>;
      return { playerId: str(q.playerId) ?? "", score: num(q.score), rank: num(q.rank), teamKey: str(q.teamKey) };
    }),
    teams: list(r.teams).map((t) => {
      const q = (t ?? {}) as Record<string, unknown>;
      return { key: str(q.key) ?? "", name: typeof q.name === "string" ? q.name.trim() : "", won: q.won === true };
    }),
    coopWon: r.coopWon === true ? true : r.coopWon === false ? false : null,
    durationMinutes: num(r.durationMinutes),
    notes: str(r.notes),
  };
}

/** The argument of the save_play database function, with the Ranking already computed. */
export function toSavePlayPayload(play: PlayInput, lowerScoreWins: boolean) {
  const ranks = play.mode === "competitive" ? computeRanking(play.participants, lowerScoreWins) : new Map<string, number | null>();
  return {
    id: play.id ?? null,
    session_id: play.sessionId,
    game_id: play.gameId,
    play_mode: play.mode,
    duration_minutes: play.durationMinutes,
    notes: play.notes,
    coop_won: play.mode === "cooperative" ? play.coopWon : null,
    expansion_ids: play.expansionIds,
    teams: play.mode === "team" ? play.teams.map((t) => ({ key: t.key, name: t.name, won: t.won })) : [],
    participants: play.participants.map((p) => ({
      player_id: p.playerId,
      score: play.mode === "competitive" ? p.score : null,
      rank: ranks.get(p.playerId) ?? null,
      team_key: play.mode === "team" ? p.teamKey : null,
    })),
  };
}
