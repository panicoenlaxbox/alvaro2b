import Link from "next/link";
import { formatSessionDate, SESSION_STATUS_LABELS, type SessionStatus } from "@/lib/domain/session";
import { DateTile } from "./date-tile";

export const STATUS_CHIP: Record<SessionStatus, string> = {
  planned: "border-green text-green",
  held: "border-border text-soft",
  cancelled: "border-dashed border-border text-muted line-through",
};

export function SessionCard({
  session,
  pendingClose = false,
}: {
  session: { id: string; date: string; name: string | null; place: string | null; status: SessionStatus; playCount: number; attendeeCount: number };
  pendingClose?: boolean;
}) {
  const details = [
    session.place,
    session.attendeeCount ? `${session.attendeeCount} ${session.attendeeCount === 1 ? "asistente" : "asistentes"}` : null,
    session.playCount ? `${session.playCount} ${session.playCount === 1 ? "partida" : "partidas"}` : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/sessions/${session.id}`}
      className={`card flex items-center gap-3 p-3 transition-transform hover:-translate-y-0.5 ${pendingClose ? "border-danger" : ""} ${session.status === "cancelled" ? "opacity-70" : ""}`}
    >
      <DateTile date={session.date} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-bold leading-snug first-letter:uppercase">{session.name ?? formatSessionDate(session.date)}</p>
        {session.name && <p className="text-sm text-soft first-letter:uppercase">{formatSessionDate(session.date)}</p>}
        {details.length > 0 && <p className="text-sm text-muted">{details.join(" · ")}</p>}
        <span className={`chip ${pendingClose ? "border-danger text-danger" : STATUS_CHIP[session.status]}`}>
          {pendingClose ? "Pendiente de cerrar" : SESSION_STATUS_LABELS[session.status]}
        </span>
      </div>
    </Link>
  );
}
