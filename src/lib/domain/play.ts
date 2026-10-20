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
  startedAt: string | null;
  endedAt: string | null;
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

/** Checks a Play before saving. Results are optional, but when present they must fit the mode. */
export function validatePlay(play: PlayInput): ValidationResult {
  if (!play.gameId) return { ok: false, error: "Elige el juego." };
  if (play.participants.length === 0) return { ok: false, error: "Añade al menos un participante." };
  if (new Set(play.participants.map((p) => p.playerId)).size !== play.participants.length) {
    return { ok: false, error: "Hay participantes repetidos." };
  }
  if (play.durationMinutes !== null && (!Number.isInteger(play.durationMinutes) || play.durationMinutes < 1 || play.durationMinutes > 6000)) {
    return { ok: false, error: "La duración debe estar entre 1 y 6000 minutos." };
  }
  if (play.notes !== null && play.notes.length > 4000) return { ok: false, error: "Las notas son demasiado largas." };

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
      if (play.teams.some((t) => !t.name.trim() || t.name.length > 60)) return { ok: false, error: "Pon nombre a cada equipo." };
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

/** Whole minutes between two instants, at least one. */
export function minutesBetween(startedAt: string, endedAt: string): number {
  return Math.max(1, Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 60000));
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
