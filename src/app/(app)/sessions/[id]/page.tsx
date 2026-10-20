import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { listPlayers } from "@/lib/data/players";
import { listSessionPlays } from "@/lib/data/plays";
import { PlayResult, playSummary } from "@/components/play-result";
import {
  canCancel,
  canStart,
  formatSessionDate,
  isPendingClose,
  RSVP_LABELS,
  SESSION_STATUS_LABELS,
  todayIso,
} from "@/lib/domain/session";
import { appUrl, whatsappUrl } from "@/lib/share";
import { createClient } from "@/lib/supabase/server";
import { AttendeesEditor, DeleteSessionButton, RsvpButtons, StatusButtons } from "./session-detail-forms";

export async function generateMetadata({ params }: PageProps<"/sessions/[id]">): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("sessions").select("date").eq("id", id).maybeSingle();
  return { title: data ? `Sesión del ${formatSessionDate(data.date)}` : "Sesión" };
}

export default async function SessionPage({ params }: PageProps<"/sessions/[id]">) {
  const member = await requireMember();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: session }, players, plays] = await Promise.all([
    supabase
      .from("sessions")
      .select("*, session_attendees(player_id), rsvps(player_id, response)")
      .eq("id", id)
      .maybeSingle(),
    listPlayers(),
    listSessionPlays(id),
  ]);
  if (!session) notFound();

  const names = new Map(players.map((p) => [p.id, p.display_name]));
  const attendeeIds = session.session_attendees.map((a) => a.player_id);
  const myRsvp = session.rsvps.find((r) => r.player_id === member.playerId)?.response ?? null;
  const playCount = plays.length;
  const pending = isPendingClose({ status: session.status, date: session.date, playCount }, todayIso());
  const url = `${appUrl()}/sessions/${session.id}`;
  const shareText = `Quedada de juegos el ${formatSessionDate(session.date)}${session.place ? ` en ${session.place}` : ""}. ¿Te vienes? ${url}`;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`chip ${pending ? "border-accent text-accent" : ""}`}>
            {pending ? "Pendiente de cerrar" : SESSION_STATUS_LABELS[session.status]}
          </span>
        </div>
        <h1 className="text-2xl font-bold first-letter:uppercase">{formatSessionDate(session.date)}</h1>
        {session.place && <p className="text-muted">{session.place}</p>}
        {session.notes && <p className="whitespace-pre-line">{session.notes}</p>}
      </section>

      {pending && (
        <p className="card border-accent text-sm">
          La fecha ya pasó y no hay partidas. Registra lo que se jugó o cancela la sesión.
        </p>
      )}

      {(canStart(session.status) || canCancel(session.status)) && <StatusButtons sessionId={session.id} />}

      {session.status === "planned" && (
        <section className="card space-y-3">
          <h2 className="font-semibold">¿Vienes?</h2>
          <RsvpButtons sessionId={session.id} current={myRsvp} />
          {session.rsvps.length > 0 && (
            <ul className="space-y-1 text-sm">
              {session.rsvps.map((r) => (
                <li key={r.player_id} className="flex justify-between">
                  <span>{names.get(r.player_id)}</span>
                  <span className="text-muted">{RSVP_LABELS[r.response]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Partidas ({plays.length})</h2>
          {session.status !== "cancelled" && (
            <Link href={`/sessions/${session.id}/plays/new`} className="btn-primary">
              Registrar partida
            </Link>
          )}
        </div>
        {plays.length === 0 && <p className="text-sm text-muted">Aún no hay partidas.</p>}
        {plays.map((play) => (
          <Link key={play.id} href={`/plays/${play.id}`} className="card block space-y-2 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{play.game.name}</p>
              {play.startedAt && !play.endedAt ? (
                <span className="chip border-accent text-accent">En juego</span>
              ) : (
                <span className="text-xs text-muted">{playSummary(play)}</span>
              )}
            </div>
            <PlayResult play={play} compact />
          </Link>
        ))}
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Asistentes ({attendeeIds.length})</h2>
        <AttendeesEditor sessionId={session.id} players={players} selected={attendeeIds} />
      </section>

      <section className="flex flex-wrap gap-2">
        {session.status === "planned" && (
          <Link href={`/games?session=${session.id}`} className="btn-secondary">
            Elegir juego para esta sesión
          </Link>
        )}
        <a href={whatsappUrl(shareText)} target="_blank" rel="noreferrer" className="btn-secondary">
          Compartir por WhatsApp
        </a>
        <Link href={`/sessions/${session.id}/edit`} className="btn-secondary">
          Editar
        </Link>
        {(member.isAdmin || session.created_by === member.userId) && <DeleteSessionButton sessionId={session.id} />}
      </section>
    </div>
  );
}
