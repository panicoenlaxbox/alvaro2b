import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { getPlay } from "@/lib/data/plays";
import { PLAY_MODE_LABELS } from "@/lib/domain/game-form";
import { sessionSummary } from "@/lib/data/photos";
import { createClient } from "@/lib/supabase/server";
import { FlavorText } from "@/components/flavor-text";
import { SessionHeader } from "@/components/session-header";
import { PlayResult, playSummary } from "@/components/play-result";
import { DeletePlayButton } from "./play-detail-forms";

export async function generateMetadata({ params }: PageProps<"/plays/[id]">): Promise<Metadata> {
  const play = await getPlay((await params).id);
  return { title: play ? `Partida de ${play.game.name}` : "Partida" };
}

export default async function PlayPage({ params }: PageProps<"/plays/[id]">) {
  await requireMember();
  const play = await getPlay((await params).id);
  if (!play) notFound();
  const { data: session } = await (await createClient())
    .from("sessions")
    .select("date, name, place, plays(created_at, games(id, name)), session_attendees(players(display_name, avatar_url))")
    .eq("id", play.sessionId)
    .maybeSingle();

  const summary = playSummary(play);

  return (
    <div className="space-y-6">
      {session && <SessionHeader session={sessionSummary(play.sessionId, session)} />}
      <section className="space-y-1">
        <h1 className="text-3xl sm:text-4xl">
          <Link href={`/games/${play.game.id}`}>{play.game.name}</Link>
        </h1>
        <div className="flex flex-wrap gap-2">
          <span className="chip">{PLAY_MODE_LABELS[play.mode]}</span>
          {summary && <span className="chip">{summary}</span>}
        </div>
      </section>

      <section className="card">
        <PlayResult play={play} />
      </section>

      {play.notes && <FlavorText>{play.notes}</FlavorText>}

      <section className="actions">
        <Link href={`/plays/${play.id}/edit`} className="btn-secondary">
          Editar
        </Link>
        <Link href={`/sessions/${play.sessionId}/plays/new?game=${play.game.id}`} className="btn-secondary">
          Otra partida a este juego
        </Link>
        <DeletePlayButton playId={play.id} />
      </section>
    </div>
  );
}
