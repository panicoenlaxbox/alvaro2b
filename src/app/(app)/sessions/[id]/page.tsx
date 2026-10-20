import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { listPlayers } from "@/lib/data/players";
import { listSessionPlays } from "@/lib/data/plays";
import { listPhotos } from "@/lib/data/photos";
import { DateTile } from "@/components/date-tile";
import { PhotoGrid } from "@/components/photo-grid";
import { STATUS_CHIP } from "@/components/session-card";
import { PhotoUploader } from "@/components/photo-uploader";
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
import { isPollOpen } from "@/lib/domain/poll";
import { AttendeesEditor, DeleteSessionButton, OpenPollForm, RsvpButtons, StatusButtons } from "./session-detail-forms";

export async function generateMetadata({ params }: PageProps<"/sessions/[id]">): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("sessions").select("date, name").eq("id", id).maybeSingle();
  return { title: data ? (data.name ?? `Sesión del ${formatSessionDate(data.date)}`) : "Sesión" };
}

export default async function SessionPage({ params }: PageProps<"/sessions/[id]">) {
  const member = await requireMember();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: session }, players, plays, photos] = await Promise.all([
    supabase
      .from("sessions")
      .select("*, session_attendees(player_id), rsvps(player_id, response), polls(id, closes_at, closed_at, candidates(count))")
      .eq("id", id)
      .maybeSingle(),
    listPlayers(),
    listSessionPlays(id),
    listPhotos(id),
  ]);
  if (!session) notFound();

  const names = new Map(players.map((p) => [p.id, p.display_name]));
  const attendeeIds = session.session_attendees.map((a) => a.player_id);
  const myRsvp = session.rsvps.find((r) => r.player_id === member.playerId)?.response ?? null;
  const playCount = plays.length;
  const pending = isPendingClose({ status: session.status, date: session.date, playCount }, todayIso());
  const url = `${appUrl()}/sessions/${session.id}`;
  const when = `el ${formatSessionDate(session.date)}${session.place ? ` en ${session.place}` : ""}`;
  const shareText = `${session.name ? `«${session.name}», ${when}` : `Quedada de juegos ${when}`}. ¿Te vienes? ${url}`;

  return (
    <div className="space-y-6">
      <section className="flex items-start gap-4">
        <DateTile date={session.date} size="lg" />
        <div className="min-w-0 space-y-2">
          <span className={`chip ${pending ? "border-coral text-coral" : STATUS_CHIP[session.status]}`}>
            {pending ? "Pendiente de cerrar" : SESSION_STATUS_LABELS[session.status]}
          </span>
          <h1 className="text-2xl break-words first-letter:uppercase sm:text-4xl">{session.name ?? formatSessionDate(session.date)}</h1>
          {session.name && <p className="font-medium text-soft first-letter:uppercase">{formatSessionDate(session.date)}</p>}
          {session.place && <p className="text-soft">{session.place}</p>}
        </div>
      </section>
      {session.notes && <p className="whitespace-pre-line text-soft">{session.notes}</p>}

      {pending && (
        <p className="alert">
          La fecha ya pasó y no hay partidas. Registra lo que se jugó o cancela la sesión.
        </p>
      )}

      {/* One column on the phone (RSVP and the poll first); on wide screens the Plays and Photos sit beside the rest. */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="contents lg:block lg:space-y-6">
          <div className="order-4 empty:hidden lg:order-none">
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg">Partidas ({plays.length})</h2>
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
                      <span className="chip border-accent bg-accent font-bold text-ink">En juego</span>
                    ) : (
                      <span className="text-xs text-muted">{playSummary(play)}</span>
                    )}
                  </div>
                  <PlayResult play={play} compact />
                </Link>
              ))}
            </section>
          </div>
          <div className="order-6 empty:hidden lg:order-none">
            <section className="space-y-3">
              <h2 className="text-lg">Fotos ({photos.length})</h2>
              {session.status !== "cancelled" && <PhotoUploader sessionId={session.id} />}
              <PhotoGrid photos={photos} />
            </section>
          </div>
        </div>
        <aside className="contents lg:block lg:space-y-6">
          <div className="order-1 empty:hidden lg:order-none">
            {(canStart(session.status) || canCancel(session.status)) && <StatusButtons sessionId={session.id} />}
          </div>
          <div className="order-2 empty:hidden lg:order-none">
            {session.status === "planned" && (
              <section className="card space-y-3">
                <h2>¿Vienes?</h2>
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
          </div>
          <div className="order-3 empty:hidden lg:order-none">
            {session.polls ? (
              <Link href={`/polls/${session.polls.id}`} className="card flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="font-semibold">Votación: ¿a qué jugamos?</span>
                <span className="text-sm text-muted">
                  {session.polls.candidates[0]?.count ?? 0} candidatos ·{" "}
                  {isPollOpen({ closesAt: session.polls.closes_at, closedAt: session.polls.closed_at }) ? "abierta" : "cerrada"}
                </span>
              </Link>
            ) : (
              session.status === "planned" && (
                <details className="card">
                  <summary className="cursor-pointer font-semibold">Abrir votación para decidir a qué jugar</summary>
                  <div className="mt-3">
                    <OpenPollForm sessionId={session.id} />
                  </div>
                </details>
              )
            )}
          </div>
          <div className="order-5 empty:hidden lg:order-none">
            <section className="card space-y-3">
              <h2>Asistentes ({attendeeIds.length})</h2>
              <AttendeesEditor sessionId={session.id} players={players} selected={attendeeIds} />
            </section>
          </div>
          <div className="order-7 empty:hidden lg:order-none">
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
        </aside>
      </div>
    </div>
  );
}
