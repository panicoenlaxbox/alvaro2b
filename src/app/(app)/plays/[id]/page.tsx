import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { getPlay } from "@/lib/data/plays";
import { PLAY_MODE_LABELS } from "@/lib/domain/game-form";
import { formatSessionDate } from "@/lib/domain/session";
import { PlayResult, playSummary } from "@/components/play-result";
import { DeletePlayButton, RunningTimer } from "./play-detail-forms";

export async function generateMetadata({ params }: PageProps<"/plays/[id]">): Promise<Metadata> {
  const play = await getPlay((await params).id);
  return { title: play ? `Partida de ${play.game.name}` : "Partida" };
}

export default async function PlayPage({ params }: PageProps<"/plays/[id]">) {
  const member = await requireMember();
  const play = await getPlay((await params).id);
  if (!play) notFound();

  const running = play.startedAt !== null && play.endedAt === null;
  const summary = playSummary(play);

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <Link href={`/sessions/${play.sessionId}`} className="inline-block text-sm text-muted underline first-letter:uppercase">
          {formatSessionDate(play.sessionDate)}
        </Link>
        <h1 className="text-2xl font-bold">
          <Link href={`/games/${play.game.id}`}>{play.game.name}</Link>
        </h1>
        <div className="flex flex-wrap gap-2">
          <span className="chip">{PLAY_MODE_LABELS[play.mode]}</span>
          {summary && <span className="chip">{summary}</span>}
        </div>
      </section>

      {running && <RunningTimer playId={play.id} startedAt={play.startedAt!} />}

      <section className="card">
        {running && play.mode !== "cooperative" && play.participants.every((p) => p.rank === null) ? (
          <p className="text-sm text-muted">En juego: {play.participants.map((p) => p.name).join(", ")}</p>
        ) : (
          <PlayResult play={play} />
        )}
      </section>

      {play.notes && <p className="whitespace-pre-line">{play.notes}</p>}

      <section className="flex flex-wrap gap-2">
        <Link href={`/plays/${play.id}/edit`} className="btn-secondary">
          {running ? "Editar" : "Editar resultado"}
        </Link>
        <Link href={`/sessions/${play.sessionId}/plays/new?game=${play.game.id}`} className="btn-secondary">
          Otra partida a este juego
        </Link>
        {(member.isAdmin || play.createdBy === member.userId) && <DeletePlayButton playId={play.id} />}
      </section>
    </div>
  );
}
