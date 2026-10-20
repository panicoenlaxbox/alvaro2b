import type { Metadata } from "next";
import { requireMember } from "@/lib/auth";
import { bggEnabled, getBggThing } from "@/lib/bgg/client";
import { toGameDefaults } from "@/lib/bgg/parse";
import { listMembers } from "@/lib/data/players";
import { createGame } from "../actions";
import { GameForm } from "../game-form";
import { BggSearch } from "./bgg-search";

export const metadata: Metadata = { title: "Añadir juego" };

export default async function NewGamePage({ searchParams }: PageProps<"/games/new">) {
  await requireMember();
  const { bgg } = await searchParams;
  const enabled = bggEnabled();
  const [owners, thing] = await Promise.all([listMembers(), enabled && typeof bgg === "string" ? getBggThing(Number(bgg)) : null]);
  const defaults = thing ? toGameDefaults(thing) : undefined;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl sm:text-4xl">Añadir juego</h1>
      {enabled && !thing && <BggSearch />}
      {thing && <p className="card text-sm">Datos importados de BoardGameGeek. Revísalos y completa lo que falte.</p>}
      {enabled && typeof bgg === "string" && !thing && (
        <p className="text-sm text-muted">No se ha podido leer ese juego de BoardGameGeek. Vuelve a intentarlo o añádelo a mano.</p>
      )}
      <GameForm key={thing?.id ?? "manual"} action={createGame} owners={owners} submitLabel="Añadir juego" defaults={defaults} />
    </div>
  );
}
