import type { Metadata } from "next";
import { Suspense } from "react";
import { bggEnabled, bggGameUrl } from "@/lib/bgg/client";
import { BggInfo } from "@/components/bgg-info";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { listMembers } from "@/lib/data/players";
import { durationText, PLAY_MODE_LABELS, playersText } from "@/lib/domain/game-form";
import { starsText, summarizeRatings } from "@/lib/domain/ratings";
import { ATTACHMENTS_BUCKET, coverUrl, signedUrls } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "@/components/cover";
import { CoverUploader, DeleteGameButton, ExpansionList, RatingPicker, RetireGameButton } from "./game-detail-forms";
import { Attachments, type AttachmentItem } from "./attachments";

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

  const [{ data: game }, members, { data: attachments }] = await Promise.all([
    supabase
      .from("games")
      .select("*, owner:players!games_owner_id_fkey(display_name), ratings(player_id, stars), expansions(id, name, retired_at, created_by, owner:players!expansions_owner_id_fkey(display_name))")
      .eq("id", id)
      .maybeSingle(),
    listMembers(),
    supabase.from("game_attachments").select("id, kind, url, path, file_name, size_bytes, created_by").eq("game_id", id).order("created_at"),
  ]);
  if (!game) notFound();

  const [signed, attachmentUrls] = await Promise.all([
    signedUrls([game.cover_path]),
    signedUrls((attachments ?? []).map((a) => a.path), ATTACHMENTS_BUCKET),
  ]);
  const attachmentItems: AttachmentItem[] = (attachments ?? []).map((a) => {
    const canDelete = member.isAdmin || a.created_by === member.userId;
    return a.kind === "link"
      ? { id: a.id, kind: "link", url: a.url!, canDelete }
      : { id: a.id, kind: "file", url: attachmentUrls.get(a.path!) ?? null, fileName: a.file_name!, sizeBytes: a.size_bytes!, canDelete };
  });
  const names = new Map(members.map((m) => [m.id, m.display_name]));
  const ratings = summarizeRatings(game.ratings.map((r) => ({ playerId: r.player_id, stars: r.stars })), names);
  const myStars = game.ratings.find((r) => r.player_id === member.playerId)?.stars ?? 0;
  const canDelete = member.isAdmin || game.created_by === member.userId;

  const stats = [
    { label: "Jugadores", value: playersText(game.min_players, game.max_players)?.replace(" jugadores", "") },
    { label: "Duración", value: durationText(game.min_duration, game.max_duration) },
    { label: "Complejidad", value: game.complexity !== null ? `${Number(game.complexity).toLocaleString("es-ES")}/5` : null },
    { label: "Año", value: game.year ? String(game.year) : null },
  ].filter((f) => f.value);

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-4 sm:gap-8">
        <Cover url={coverUrl(game, signed)} name={game.name} className="size-28 text-5xl shadow-hard-lg sm:size-48 sm:text-7xl" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-ink px-2.5 py-0.5 font-display text-xs text-teal">{PLAY_MODE_LABELS[game.default_play_mode]}</span>
            {game.retired_at && <span className="chip border-dashed text-muted">Retirado</span>}
            {game.lower_score_wins && <span className="chip">Gana la puntuación más baja</span>}
          </div>
          <h1 className="text-3xl break-words sm:text-5xl">{game.name}</h1>
          <p className="text-soft">
            {game.owner ? `De ${game.owner.display_name}` : "Sin dueño"}
            {ratings.average !== null && (
              <>
                {" · "}
                <span className="font-bold text-accent">★ {ratings.average.toLocaleString("es-ES")}</span> <span className="text-muted">({ratings.count})</span>
              </>
            )}
          </p>
        </div>
      </section>

      {stats.length > 0 && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((f) => (
            <div key={f.label} className="rounded-xl border-2 border-ink bg-card px-3 py-2.5">
              <dt className="text-xs font-bold tracking-wider text-muted uppercase">{f.label}</dt>
              <dd className="font-display text-xl">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-6">
          {game.notes && <p className="text-lg whitespace-pre-line text-soft">{game.notes}</p>}

          {game.bgg_id !== null &&
            (bggEnabled() ? (
              <Suspense fallback={<p className="card text-sm text-muted">Consultando BoardGameGeek…</p>}>
                <BggInfo bggId={game.bgg_id} />
              </Suspense>
            ) : (
              <a href={bggGameUrl(game.bgg_id)} target="_blank" rel="noreferrer" className="block text-sm underline">
                Ver en BoardGameGeek
              </a>
            ))}

          <section className="card space-y-3">
            <h2>Tu valoración</h2>
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
            <h2>Expansiones</h2>
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

        </div>
        <aside className="space-y-6">
          <section className="card space-y-3">
            <h2>Ficheros y enlaces</h2>
            <Attachments gameId={game.id} items={attachmentItems} />
          </section>

          <section className="card space-y-3">
            <h2>Carátula</h2>
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
        </aside>
      </div>
    </div>
  );
}
