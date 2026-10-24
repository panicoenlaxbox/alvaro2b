import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { listPlayers } from "@/lib/data/players";
import { listSessionPlays } from "@/lib/data/plays";
import { listPhotos } from "@/lib/data/photos";
import { DateTile } from "@/components/date-tile";
import { PhotoGrid } from "@/components/photo-grid";
import { PhotoUploader } from "@/components/photo-uploader";
import { PlayResult, playSummary } from "@/components/play-result";
import { formatSessionDate, formatSessionTime, isUpcoming, todayIso } from "@/lib/domain/session";
import { appUrl } from "@/lib/share";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { createClient } from "@/lib/supabase/server";
import { isPollOpen, rankCandidates } from "@/lib/domain/poll";
import { PollRanking } from "@/components/poll-ranking";
import { Avatar } from "@/components/avatar";
import { FlavorText } from "@/components/flavor-text";
import { DeleteSessionButton, OpenPollForm, RsvpButtons } from "./session-detail-forms";

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
      .select("*, session_attendees(player_id, maybe), polls(id, closes_at, closed_at, candidates(id, game_id, chosen, games(name), approvals(player_id)))")
      .eq("id", id)
      .maybeSingle(),
    listPlayers(),
    listSessionPlays(id),
    listPhotos(id),
  ]);
  if (!session) notFound();

  const attendees = session.session_attendees
    .flatMap((a) => {
      const player = players.find((p) => p.id === a.player_id);
      return player ? [{ ...player, maybe: a.maybe }] : [];
    })
    .sort((a, b) => a.display_name.localeCompare(b.display_name, "es"));
  const mine = session.session_attendees.find((a) => a.player_id === member.playerId);
  const myAnswer = mine ? (mine.maybe ? "maybe" : "yes") : null;
  const upcoming = isUpcoming(session.date, todayIso());
  const url = `${appUrl()}/sessions/${session.id}`;
  const time = formatSessionTime(session.start_time);
  const when = `el ${formatSessionDate(session.date)}${time ? ` a las ${time}` : ""}${session.place ? ` en ${session.place}` : ""}`;
  // Under the title: the date when a name took its place, and the time.
  const subtitle = [session.name ? formatSessionDate(session.date) : null, time].filter(Boolean).join(", ");
  const ranked = session.polls
    ? rankCandidates(
        session.polls.candidates.map((c) => ({
          id: c.id,
          gameId: c.game_id,
          name: c.games?.name ?? "?",
          approvals: c.approvals.map((a) => a.player_id),
          chosen: c.chosen,
        })),
      )
    : [];
  const shareText =`${session.name ? `«${session.name}», ${when}` : `Sesión de juegos ${when}`}. ¿Te vienes? ${url}`;

  return (
    <div className="space-y-6">
      {/* The buttons take the whole width under the header on a phone, and sit under the title from `sm` up. */}
      <section className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-4 sm:gap-y-3">
        <DateTile date={session.date} size="lg" className="sm:row-span-2" />
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl break-words first-letter:uppercase sm:text-4xl">{session.name ?? formatSessionDate(session.date)}</h1>
          {subtitle && <p className="font-medium text-soft first-letter:uppercase">{subtitle}</p>}
          {session.place && <p className="text-soft">{session.place}</p>}
        </div>
        <div className="actions col-span-2 sm:col-span-1 sm:col-start-2">
          <WhatsAppButton text={shareText} label="Compartir por WhatsApp" className="flex-none" />
          <Link href={`/sessions/${session.id}/edit`} className="btn-secondary">
            Editar
          </Link>
          <DeleteSessionButton sessionId={session.id} />
        </div>
      </section>
      {session.notes && <FlavorText>{session.notes}</FlavorText>}

      {/* One column on the phone (RSVP and the Attendees first); on wide screens the Plays and Photos sit beside the rest. */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="contents lg:block lg:space-y-6">
          <div className="order-5 empty:hidden lg:order-none">
            <section className="space-y-3">
              <h2 className="text-lg">Partidas ({plays.length})</h2>
              <Link href={`/sessions/${session.id}/plays/new`} className="btn-primary">
                Añadir
              </Link>
              {plays.map((play) => (
                <Link key={play.id} href={`/plays/${play.id}`} className="card block space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{play.game.name}</p>
                    <span className="text-xs text-muted">{playSummary(play)}</span>
                  </div>
                  <PlayResult play={play} compact />
                </Link>
              ))}
            </section>
          </div>
          <div className="order-6 empty:hidden lg:order-none">
            <section className="space-y-3">
              <h2 className="text-lg">Fotos ({photos.length})</h2>
              <PhotoUploader sessionId={session.id} />
              <PhotoGrid photos={photos} />
            </section>
          </div>
        </div>
        <aside className="contents lg:block lg:space-y-6">
          <div className="order-2 empty:hidden lg:order-none">
            {upcoming && (
              <section className="card space-y-3">
                <h2>¿Vienes?</h2>
                <RsvpButtons sessionId={session.id} current={myAnswer} />
              </section>
            )}
          </div>
          <div className="order-3 empty:hidden lg:order-none">
            <section className="card space-y-3">
              <h2>Asistentes ({attendees.length})</h2>
              {attendees.length > 0 && (
                <ul className="space-y-1.5">
                  {attendees.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 text-sm">
                      <span className={p.maybe ? "inline-flex opacity-40" : "inline-flex"}>
                        <Avatar name={p.display_name} url={p.avatar_url} />
                      </span>
                      <span>{p.display_name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          <div className="order-4 empty:hidden lg:order-none">
            {session.polls ? (
              <Link href={`/polls/${session.polls.id}`} className="card block space-y-3">
                <h2>Votación</h2>
                <p className="text-sm text-muted">
                  ¿A qué jugamos? · {isPollOpen({ closesAt: session.polls.closes_at, closedAt: session.polls.closed_at }) ? "abierta" : "cerrada"}
                </p>
                {ranked.length > 0 ? <PollRanking ranked={ranked} /> : <p className="text-sm text-muted">Aún no hay candidatos.</p>}
              </Link>
            ) : (
              upcoming && (
                <details className="card">
                  <summary className="cursor-pointer">
                    <h2 className="inline">Votación</h2>
                  </summary>
                  <div className="mt-3">
                    <OpenPollForm sessionId={session.id} sessionDate={session.date} today={todayIso()} />
                  </div>
                </details>
              )
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
