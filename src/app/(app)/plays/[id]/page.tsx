import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { listPhotos } from "@/lib/data/photos";
import { getPlay } from "@/lib/data/plays";
import { PLAY_MODE_LABELS } from "@/lib/domain/game-form";
import { SESSION_SUMMARY_SELECT, sessionSummary } from "@/lib/data/sessions";
import { createClient } from "@/lib/supabase/server";
import { FlavorText } from "@/components/flavor-text";
import { PhotoGrid } from "@/components/photo-grid";
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
  const [{ data: session }, photos] = await Promise.all([
    (await createClient()).from("sessions").select(SESSION_SUMMARY_SELECT).eq("id", play.sessionId).maybeSingle(),
    listPhotos({ playId: play.id }),
  ]);

  const summary = playSummary(play);
  // The Play's own Game is the title below: the header lists only the Session's other Games.
  const header = session && sessionSummary(play.sessionId, session);

  return (
    <div className="space-y-6">
      {header && <SessionHeader session={{ ...header, games: header.games.filter((g) => g.id !== play.game.id) }} />}
      <section className="space-y-3">
        <h1 className="text-3xl sm:text-4xl">
          <Link href={`/games/${play.game.id}`} className="link">
            {play.game.name}
          </Link>
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

      {photos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg">Fotos ({photos.length})</h2>
          <PhotoGrid photos={photos} />
        </section>
      )}

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
