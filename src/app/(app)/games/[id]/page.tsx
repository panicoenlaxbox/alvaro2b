import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { listMembers } from "@/lib/data/players";
import { durationText, PLAY_MODE_LABELS, playersText } from "@/lib/domain/game-form";
import { starsText, summarizeRatings } from "@/lib/domain/ratings";
import { coverUrl, signedUrls } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "@/components/cover";
import { CoverUploader, DeleteGameButton, ExpansionList, RatingPicker, RetireGameButton } from "./game-detail-forms";

export async function generateMetadata({ params }: PageProps<"/games/[id]">): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("games").select("name").eq("id", id).maybeSingle();
  return { title: data?.name ?? "Juego" };
}

export default async function GamePage({ params }: PageProps<"/games/[id]">) {
  const member = await requireMember();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: game }, members] = await Promise.all([
    supabase
      .from("games")
      .select("*, owner:players!games_owner_id_fkey(display_name), ratings(player_id, stars), expansions(id, name, retired_at, created_by, owner:players!expansions_owner_id_fkey(display_name))")
      .eq("id", id)
      .maybeSingle(),
    listMembers(),
  ]);
  if (!game) notFound();

  const signed = await signedUrls([game.cover_path]);
  const names = new Map(members.map((m) => [m.id, m.display_name]));
  const ratings = summarizeRatings(game.ratings.map((r) => ({ playerId: r.player_id, stars: r.stars })), names);
  const myStars = game.ratings.find((r) => r.player_id === member.playerId)?.stars ?? 0;
  const canDelete = member.isAdmin || game.created_by === member.userId;

  const facts = [
    playersText(game.min_players, game.max_players),
    durationText(game.min_duration, game.max_duration),
    game.complexity !== null ? `Complejidad ${Number(game.complexity).toLocaleString("es-ES")}/5` : null,
    PLAY_MODE_LABELS[game.default_play_mode],
    game.lower_score_wins ? "Gana la puntuación más baja" : null,
    game.year ? String(game.year) : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <section className="flex gap-4">
        <Cover url={coverUrl(game, signed)} name={game.name} className="size-28" />
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold leading-tight">{game.name}</h1>
          {game.retired_at && <span className="chip border-dashed text-muted">Retirado</span>}
          <p className="text-sm text-muted">{game.owner ? `De ${game.owner.display_name}` : "Sin dueño"}</p>
          {ratings.average !== null && (
            <p className="text-sm">
              <span className="text-accent">★ {ratings.average.toLocaleString("es-ES")}</span>{" "}
              <span className="text-muted">({ratings.count})</span>
            </p>
          )}
        </div>
      </section>

      {facts.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {facts.map((f) => (
            <li key={f} className="chip">
              {f}
            </li>
          ))}
        </ul>
      )}

      {game.notes && <p className="whitespace-pre-line">{game.notes}</p>}

      <section className="card space-y-3">
        <h2 className="font-semibold">Tu valoración</h2>
        <RatingPicker gameId={game.id} stars={myStars} />
        {ratings.breakdown.length > 0 && (
          <ul className="space-y-1 text-sm">
            {ratings.breakdown.map((r) => (
              <li key={r.playerId} className="flex justify-between gap-2">
                <span>{r.name}</span>
                <span className="text-accent" aria-label={`${r.stars} estrellas`}>
                  {starsText(r.stars)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Expansiones</h2>
        <ExpansionList
          gameId={game.id}
          owners={members}
          expansions={game.expansions.map((e) => ({
            id: e.id,
            name: e.name,
            retired: e.retired_at !== null,
            ownerName: e.owner?.display_name ?? null,
            canDelete: member.isAdmin || e.created_by === member.userId,
          }))}
        />
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Carátula</h2>
        <CoverUploader gameId={game.id} hasOwnCover={Boolean(game.cover_path)} />
      </section>

      <section className="flex flex-wrap gap-2">
        <Link href={`/games/${game.id}/edit`} className="btn-secondary">
          Editar
        </Link>
        <Link href={`/stats?game=${game.id}`} className="btn-secondary">
          Estadísticas
        </Link>
        <RetireGameButton gameId={game.id} retired={game.retired_at !== null} />
        {canDelete && <DeleteGameButton gameId={game.id} />}
      </section>
    </div>
  );
}
