import type { Metadata } from "next";
import { requireMember } from "@/lib/auth";
import { listMembers } from "@/lib/data/players";
import { createGame } from "../actions";
import { GameForm } from "../game-form";

export const metadata: Metadata = { title: "Añadir juego" };

export default async function NewGamePage() {
  await requireMember();
  const owners = await listMembers();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Añadir juego</h1>
      <GameForm action={createGame} owners={owners} submitLabel="Añadir juego" />
    </div>
  );
}
