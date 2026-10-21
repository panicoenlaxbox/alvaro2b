import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { listPlayFormGames } from "@/lib/data/play-form";
import { listPlayers } from "@/lib/data/players";
import { formatSessionDate } from "@/lib/domain/session";
import { createClient } from "@/lib/supabase/server";
import { PlayForm } from "../../../../plays/play-form";

export const metadata: Metadata = { title: "Registrar partida" };

export default async function NewPlayPage({ params, searchParams }: PageProps<"/sessions/[id]/plays/new">) {
  await requireMember();
  const { id } = await params;
  const { game } = await searchParams;
  const supabase = await createClient();

  const [{ data: session }, games, players] = await Promise.all([
    supabase.from("sessions").select("id, date, session_attendees(player_id)").eq("id", id).maybeSingle(),
    listPlayFormGames(),
    listPlayers(),
  ]);
  if (!session) notFound();

  const preselected = games.find((g) => g.id === game);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl sm:text-4xl">Registrar partida</h1>
        <p className="text-sm text-muted first-letter:uppercase">{formatSessionDate(session.date)}</p>
      </div>
      <PlayForm
        sessionId={session.id}
        games={games}
        players={players}
        initial={{
          gameId: preselected?.id ?? "",
          mode: preselected?.defaultMode ?? "competitive",
          expansionIds: [],
          // Participants start as the Session's Attendees (PRD 5).
          participants: session.session_attendees.map((a) => ({ playerId: a.player_id, score: null, rank: null, teamKey: null })),
          teams: [],
          coopWon: null,
          durationMinutes: null,
          notes: null,
        }}
      />
    </div>
  );
}
