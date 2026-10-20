import { formatDuration, ordinal, winnersOf } from "@/lib/domain/play";
import type { PlayDetail } from "@/lib/data/plays";

/** Compact result of a Play, for lists and the Play page. */
export function PlayResult({ play, compact = false }: { play: PlayDetail; compact?: boolean }) {
  const winners = new Set(winnersOf(play));

  if (play.mode === "cooperative") {
    const label = play.coopWon === null ? "Sin resultado" : play.coopWon ? "¡Ganamos!" : "Perdimos";
    return (
      <div className="space-y-1">
        <p className={`font-semibold ${play.coopWon ? "text-accent" : ""}`}>{label}</p>
        <p className="text-sm text-muted">{play.participants.map((p) => p.name).join(", ")}</p>
      </div>
    );
  }

  if (play.mode === "team") {
    return (
      <ul className="space-y-1">
        {play.teams.map((t) => (
          <li key={t.id} className="text-sm">
            <span className={`font-semibold ${t.won ? "text-accent" : ""}`}>
              {t.won ? "🏆 " : ""}
              {t.name}
            </span>
            <span className="text-muted">: {play.participants.filter((p) => p.teamId === t.id).map((p) => p.name).join(", ")}</span>
          </li>
        ))}
      </ul>
    );
  }

  const shown = compact ? play.participants.slice(0, 4) : play.participants;
  return (
    <ol className="space-y-1">
      {shown.map((p) => (
        <li key={p.playerId} className="flex items-center justify-between gap-2 text-sm">
          <span className={winners.has(p.playerId) ? "font-semibold text-accent" : ""}>
            <span className="inline-block w-8 text-muted">{p.rank ? ordinal(p.rank) : "–"}</span>
            {winners.has(p.playerId) ? "🏆 " : ""}
            {p.name}
          </span>
          {p.score !== null && <span className="tabular-nums text-muted">{p.score.toLocaleString("es-ES")}</span>}
        </li>
      ))}
      {compact && play.participants.length > shown.length && <li className="text-xs text-muted">y {play.participants.length - shown.length} más</li>}
    </ol>
  );
}

export function playSummary(play: PlayDetail): string {
  return [play.expansions.length ? `con ${play.expansions.map((e) => e.name).join(", ")}` : null, formatDuration(play.durationMinutes)]
    .filter(Boolean)
    .join(" · ");
}
