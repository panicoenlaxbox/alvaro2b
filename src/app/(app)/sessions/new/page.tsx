import type { Metadata } from "next";
import { requireMember } from "@/lib/auth";
import { listPlayers } from "@/lib/data/players";
import { todayIso } from "@/lib/domain/session";
import { createSession } from "../actions";
import { SessionForm } from "../session-form";

export const metadata: Metadata = { title: "Añadir sesión" };

export default async function NewSessionPage() {
  await requireMember();
  const players = await listPlayers();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl sm:text-4xl">Añadir sesión</h1>
      <SessionForm action={createSession} players={players} today={todayIso()} />
    </div>
  );
}
