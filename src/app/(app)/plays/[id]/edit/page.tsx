import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { listPlayFormGames } from "@/lib/data/play-form";
import { listPlayers } from "@/lib/data/players";
import { getPlay } from "@/lib/data/plays";
import { PlayForm } from "../../play-form";

export const metadata: Metadata = { title: "Editar partida" };

export default async function EditPlayPage({ params }: PageProps<"/plays/[id]/edit">) {
  await requireMember();
  const { id } = await params;
  const play = await getPlay(id);
  if (!play) notFound();
  const [games, players] = await Promise.all([listPlayFormGames(play.game.id), listPlayers()]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl sm:text-4xl">Editar partida</h1>
      <PlayForm
        sessionId={play.sessionId}
        games={games}
        players={players}
        initial={{
          id: play.id,
          gameId: play.game.id,
          mode: play.mode,
          expansionIds: play.expansions.map((e) => e.id),
          participants: play.participants.map((p) => ({
            playerId: p.playerId,
            score: p.score,
            // Only ranks marked by hand are editable; computed ones come back from the Scores.
            rank: p.rank,
            teamKey: p.teamId,
          })),
          teams: play.teams.map((t) => ({ key: t.id, name: t.name, won: t.won })),
          coopWon: play.coopWon,
          durationMinutes: play.durationMinutes,
          notes: play.notes,
        }}
      />
    </div>
  );
}
