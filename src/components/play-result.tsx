import { formatDuration, ordinal, winnersOf } from "@/lib/domain/play";
import type { PlayDetail } from "@/lib/data/plays";
import { Avatar } from "./avatar";
import { Faces } from "./owners";
import { Icon, TROPHY } from "./icon";

/** Compact result of a Play, for lists and the Play page. */
export function PlayResult({ play, compact = false }: { play: PlayDetail; compact?: boolean }) {
  const winners = new Set(winnersOf(play));
  const faces = (people: PlayDetail["participants"]) =>
    [...people].map((p) => ({ id: p.playerId, name: p.name, avatarUrl: p.avatarUrl })).sort((a, b) => a.name.localeCompare(b.name, "es"));

  if (play.mode === "cooperative") {
    const label = play.coopWon === null ? "Sin resultado" : play.coopWon ? "¡Ganamos!" : "Perdimos";
    return (
      <div className="space-y-1">
        <p className={`font-semibold ${play.coopWon ? "text-accent" : ""}`}>{label}</p>
        <Faces people={faces(play.participants)} prefix="Jugaron" />
      </div>
    );
  }

  if (play.mode === "team") {
    return (
      <ul className="space-y-2">
        {play.teams.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-3 text-sm">
            <span className={`font-semibold ${t.won ? "text-accent" : ""}`}>
              {t.won && <Trophy />}
              {t.name}
            </span>
            <Faces people={faces(play.participants.filter((p) => p.teamId === t.id))} prefix={t.name} />
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
          <span className={`flex min-w-0 items-center gap-2 ${winners.has(p.playerId) ? "font-semibold text-accent" : ""}`}>
            <span className="inline-block w-8 shrink-0 text-muted">{p.rank ? ordinal(p.rank) : "–"}</span>
            <Avatar name={p.name} url={p.avatarUrl} />
            <span className="truncate">
              {winners.has(p.playerId) && <Trophy />}
              {p.name}
            </span>
          </span>
          {p.score !== null && <span className="tabular-nums text-muted">{p.score.toLocaleString("es-ES")}</span>}
        </li>
      ))}
      {compact && play.participants.length > shown.length && <li className="text-xs text-muted">y {play.participants.length - shown.length} más</li>}
    </ol>
  );
}

/** Marks the winner, in the text colour (the accent of a winning row). */
function Trophy() {
  return <Icon d={TROPHY} className="mr-1 inline size-4 -translate-y-px" />;
}

export function playSummary(play: PlayDetail): string {
  return [play.expansions.length ? `con ${play.expansions.map((e) => e.name).join(", ")}` : null, formatDuration(play.durationMinutes)]
    .filter(Boolean)
    .join(" · ");
}
