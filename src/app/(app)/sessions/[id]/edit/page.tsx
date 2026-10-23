import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { listPlayers } from "@/lib/data/players";
import { todayIso } from "@/lib/domain/session";
import { createClient } from "@/lib/supabase/server";
import { saveSession } from "../../actions";
import { SessionForm } from "../../session-form";

export const metadata: Metadata = { title: "Editar sesión" };

export default async function EditSessionPage({ params }: PageProps<"/sessions/[id]/edit">) {
  await requireMember();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: session }, players] = await Promise.all([
    supabase.from("sessions").select("id, date, start_time, name, place, notes, session_attendees(player_id, maybe)").eq("id", id).maybeSingle(),
    listPlayers(),
  ]);
  if (!session) notFound();
  const { session_attendees: attendees, ...fields } = session;
  const defaults = {
    ...fields,
    attendeeIds: attendees.map((a) => a.player_id),
    maybeIds: attendees.filter((a) => a.maybe).map((a) => a.player_id),
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl sm:text-4xl">Editar sesión</h1>
      <SessionForm action={saveSession} defaults={defaults} players={players} today={todayIso()} />
    </div>
  );
}
