import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { listMembers } from "@/lib/data/players";
import { createClient } from "@/lib/supabase/server";
import { saveGame } from "../../actions";
import { GameForm } from "../../game-form";

export const metadata: Metadata = { title: "Editar juego" };

export default async function EditGamePage({ params }: PageProps<"/games/[id]/edit">) {
  await requireMember();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: game }, owners] = await Promise.all([supabase.from("games").select("*, game_owners(player_id)").eq("id", id).maybeSingle(), listMembers()]);
  if (!game) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl sm:text-4xl">Editar {game.name}</h1>
      <GameForm
        action={saveGame}
        owners={owners}
        defaults={{ ...game, complexity: game.complexity === null ? null : Number(game.complexity), owner_ids: game.game_owners.map((o) => o.player_id) }}
      />
    </div>
  );
}
