import Link from "next/link";
import { formatSessionDate, SESSION_STATUS_LABELS, type SessionStatus } from "@/lib/domain/session";

export function SessionCard({
  session,
  pendingClose = false,
}: {
  session: { id: string; date: string; name: string | null; place: string | null; status: SessionStatus; playCount: number; attendeeCount: number };
  pendingClose?: boolean;
}) {
  const details = [
    session.place,
    session.attendeeCount ? `${session.attendeeCount} asistentes` : null,
    session.playCount ? `${session.playCount} ${session.playCount === 1 ? "partida" : "partidas"}` : null,
  ].filter(Boolean);

  return (
    <Link href={`/sessions/${session.id}`} className={`card block space-y-1 p-3 ${pendingClose ? "border-accent" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold first-letter:uppercase">{formatSessionDate(session.date)}</p>
        <span className={`chip ${pendingClose ? "border-accent text-accent" : session.status === "cancelled" ? "text-muted" : ""}`}>
          {pendingClose ? "Pendiente de cerrar" : SESSION_STATUS_LABELS[session.status]}
        </span>
      </div>
      {session.name && <p className="font-medium text-accent">{session.name}</p>}
      {details.length > 0 && <p className="text-sm text-muted">{details.join(" · ")}</p>}
    </Link>
  );
}
