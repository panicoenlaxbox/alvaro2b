"use client";

import { useMemo, useState, useTransition } from "react";
import { PLAY_MODE_LABELS, PLAY_MODES, type PlayMode } from "@/lib/domain/game-form";
import type { ParticipantInput, PlayInput, TeamInput } from "@/lib/domain/play";
import type { PlayFormGame } from "@/lib/data/play-form";
import { RequiredMark } from "@/components/form";
import { FACE_OFF, FACE_ON, NAME_OFF, NAME_ON, PlayerFace } from "@/components/player-face";
import { savePlay } from "./actions";
import { FirstPlayerDraw } from "./first-player-draw";

type Player = { id: string; display_name: string; avatar_url: string | null; is_member: boolean; active: boolean };

type Row = { playerId: string; score: string; rank: string; teamKey: string };

export type PlayFormInitial = {
  id?: string;
  gameId: string;
  mode: PlayMode;
  expansionIds: string[];
  participants: { playerId: string; score: number | null; rank: number | null; teamKey: string | null }[];
  teams: TeamInput[];
  coopWon: boolean | null;
  durationMinutes: number | null;
  startedAt: string | null;
  endedAt: string | null;
  notes: string | null;
};

const DEFAULT_TEAMS: TeamInput[] = [
  { key: "t1", name: "Equipo 1", won: false },
  { key: "t2", name: "Equipo 2", won: false },
];

export function PlayForm({
  sessionId,
  games,
  players,
  initial,
}: {
  sessionId: string;
  games: PlayFormGame[];
  players: Player[];
  initial: PlayFormInitial;
}) {
  const [gameId, setGameId] = useState(initial.gameId);
  const [mode, setMode] = useState<PlayMode>(initial.mode);
  const [expansionIds, setExpansionIds] = useState<string[]>(initial.expansionIds);
  const [rows, setRows] = useState<Row[]>(
    initial.participants.map((p) => ({
      playerId: p.playerId,
      score: p.score === null ? "" : String(p.score),
      rank: p.rank === null ? "" : String(p.rank),
      teamKey: p.teamKey ?? "",
    })),
  );
  const [teams, setTeams] = useState<TeamInput[]>(initial.teams.length ? initial.teams : DEFAULT_TEAMS);
  const [coopWon, setCoopWon] = useState<boolean | null>(initial.coopWon);
  const [duration, setDuration] = useState(initial.durationMinutes === null ? "" : String(initial.durationMinutes));
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const game = games.find((g) => g.id === gameId);
  const names = useMemo(() => new Map(players.map((p) => [p.id, p.display_name])), [players]);
  const selected = new Set(rows.map((r) => r.playerId));
  const allScored = rows.length > 0 && rows.every((r) => r.score.trim() !== "");

  function chooseGame(id: string) {
    setGameId(id);
    setExpansionIds([]);
    const g = games.find((x) => x.id === id);
    if (g) setMode(g.defaultMode);
  }

  function togglePlayer(id: string) {
    setRows((current) =>
      current.some((r) => r.playerId === id)
        ? current.filter((r) => r.playerId !== id)
        : [...current, { playerId: id, score: "", rank: "", teamKey: "" }],
    );
  }

  function updateRow(playerId: string, change: Partial<Row>) {
    setRows((current) => current.map((r) => (r.playerId === playerId ? { ...r, ...change } : r)));
  }

  function submit(start: boolean) {
    setError(null);
    const participants: ParticipantInput[] = rows.map((r) => ({
      playerId: r.playerId,
      score: mode === "competitive" && r.score.trim() !== "" ? Number(r.score.replace(",", ".")) : null,
      rank: mode === "competitive" && r.rank !== "" ? Number(r.rank) : null,
      teamKey: mode === "team" ? r.teamKey || null : null,
    }));
    const payload: PlayInput = {
      id: initial.id,
      sessionId,
      gameId,
      mode,
      expansionIds,
      participants,
      teams: mode === "team" ? teams : [],
      coopWon: mode === "cooperative" ? coopWon : null,
      durationMinutes: duration.trim() === "" ? null : Number(duration),
      startedAt: initial.startedAt,
      endedAt: initial.endedAt,
      notes: notes.trim() || null,
    };
    startTransition(async () => {
      const result = await savePlay(JSON.stringify(payload), start);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
    >
      <div>
        <label htmlFor="game" className="label">
          Juego
          <RequiredMark />
        </label>
        <select id="game" required value={gameId} onChange={(e) => chooseGame(e.target.value)} className="input">
          <option value="">Elige un juego…</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
              {g.retired ? " (retirado)" : ""}
            </option>
          ))}
        </select>
      </div>

      {game && game.expansions.length > 0 && (
        <fieldset>
          <legend className="label">Expansiones usadas</legend>
          <div className="flex flex-wrap gap-2">
            {game.expansions.map((e) => (
              <label key={e.id} className="cursor-pointer">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={expansionIds.includes(e.id)}
                  onChange={() => setExpansionIds((ids) => (ids.includes(e.id) ? ids.filter((x) => x !== e.id) : [...ids, e.id]))}
                />
                <span className="chip px-3 py-1.5 text-sm peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground">
                  {e.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="label">Modo</legend>
        <div className="grid grid-cols-3 gap-2">
          {PLAY_MODES.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={mode === m ? "btn-primary px-2" : "btn-secondary px-2"}
            >
              {PLAY_MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">
          Participantes
          <RequiredMark />
        </legend>
        <div className="flex flex-wrap gap-4">
          {players
            .filter((p) => p.active || selected.has(p.id))
            .sort((a, b) => Number(b.is_member) - Number(a.is_member) || a.display_name.localeCompare(b.display_name, "es"))
            .map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={selected.has(p.id)}
                onClick={() => togglePlayer(p.id)}
                className="flex flex-col items-center rounded-xl focus-visible:outline-2 focus-visible:outline-accent"
              >
                <PlayerFace
                  name={p.display_name}
                  avatarUrl={p.avatar_url}
                  isMember={p.is_member}
                  faceClassName={selected.has(p.id) ? FACE_ON : FACE_OFF}
                  nameClassName={selected.has(p.id) ? NAME_ON : NAME_OFF}
                />
              </button>
            ))}
        </div>
        {!initial.id && rows.length >= 2 && (
          <div className="mt-3">
            <FirstPlayerDraw key={rows.map((r) => r.playerId).join()} names={rows.map((r) => names.get(r.playerId) ?? "")} />
          </div>
        )}
      </fieldset>

      {rows.length > 0 && mode === "competitive" && (
        <fieldset className="card space-y-3">
          <legend className="sr-only">Resultado</legend>
          <p className="text-sm hint">
            {allScored
              ? `Con puntuación para todos, la clasificación se calcula sola${game?.lowerScoreWins ? " (gana la más baja)" : ""}.`
              : "Pon la puntuación de todos para calcular la clasificación, o marca las posiciones a mano (se permiten empates)."}
          </p>
          {rows.map((r) => (
            <div key={r.playerId} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate font-medium">{names.get(r.playerId)}</span>
              <input
                aria-label={`Puntuación de ${names.get(r.playerId)}`}
                inputMode="decimal"
                placeholder="Puntos"
                value={r.score}
                onChange={(e) => updateRow(r.playerId, { score: e.target.value })}
                className="input w-24"
              />
              <select
                aria-label={`Posición de ${names.get(r.playerId)}`}
                value={allScored ? "" : r.rank}
                disabled={allScored}
                onChange={(e) => updateRow(r.playerId, { rank: e.target.value })}
                className="input w-20"
              >
                <option value="">–</option>
                {rows.map((_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}.º
                  </option>
                ))}
              </select>
            </div>
          ))}
        </fieldset>
      )}

      {rows.length > 0 && mode === "cooperative" && (
        <fieldset className="card">
          <legend className="sr-only">Resultado</legend>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: true, label: "Ganamos" },
              { value: false, label: "Perdimos" },
              { value: null, label: "Sin resultado" },
            ].map((o) => (
              <button
                key={String(o.value)}
                type="button"
                aria-pressed={coopWon === o.value}
                onClick={() => setCoopWon(o.value)}
                className={coopWon === o.value ? "btn-primary px-2" : "btn-secondary px-2"}
              >
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {rows.length > 0 && mode === "team" && (
        <fieldset className="card space-y-3">
          <legend className="sr-only">Equipos</legend>
          <div className="space-y-2">
            {teams.map((t, i) => (
              <div key={t.key} className="flex items-center gap-2">
                <input
                  aria-label={`Nombre del equipo ${i + 1}`}
                  value={t.name}
                  maxLength={60}
                  onChange={(e) => setTeams((ts) => ts.map((x) => (x.key === t.key ? { ...x, name: e.target.value } : x)))}
                  className="input"
                />
                <label className="flex shrink-0 items-center gap-1 text-sm">
                  <input
                    type="radio"
                    name="winning-team"
                    checked={t.won}
                    onChange={() => setTeams((ts) => ts.map((x) => ({ ...x, won: x.key === t.key })))}
                    className="size-4"
                  />
                  Ganó
                </label>
                {teams.length > 2 && (
                  <button
                    type="button"
                    aria-label={`Quitar ${t.name}`}
                    className="text-muted"
                    onClick={() => setTeams((ts) => ts.filter((x) => x.key !== t.key))}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setTeams((ts) => [...ts, { key: `t${Date.now()}`, name: `Equipo ${ts.length + 1}`, won: false }])}
            >
              Añadir equipo
            </button>
            {teams.some((t) => t.won) && (
              <button type="button" className="btn-secondary" onClick={() => setTeams((ts) => ts.map((x) => ({ ...x, won: false })))}>
                Sin ganador
              </button>
            )}
          </div>
          {rows.map((r) => (
            <div key={r.playerId} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate font-medium">{names.get(r.playerId)}</span>
              <select
                aria-label={`Equipo de ${names.get(r.playerId)}`}
                value={r.teamKey}
                onChange={(e) => updateRow(r.playerId, { teamKey: e.target.value })}
                className="input w-40"
              >
                <option value="">Elige…</option>
                {teams.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.name || "Sin nombre"}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </fieldset>
      )}

      <div>
        <label htmlFor="duration" className="label">
          Duración (minutos)
        </label>
        <input
          id="duration"
          inputMode="numeric"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="input"
        />
      </div>

      <div>
        <label htmlFor="notes" className="label">
          Notas
        </label>
        <textarea id="notes" rows={3} maxLength={4000} value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={pending} className="btn-primary flex-1 py-3">
          {pending ? "Guardando…" : "Guardar partida"}
        </button>
        {!initial.id && (
          <button type="button" disabled={pending} onClick={() => submit(true)} className="btn-secondary flex-1 py-3">
            Empezar con cronómetro
          </button>
        )}
      </div>
    </form>
  );
}
