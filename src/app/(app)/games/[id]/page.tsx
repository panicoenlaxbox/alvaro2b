import type { Metadata } from "next";
import { Suspense } from "react";
import { bggEnabled } from "@/lib/bgg/client";
import { PoweredByBgg } from "@/components/powered-by-bgg";
import { BggInfo } from "@/components/bgg-info";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { listMembers } from "@/lib/data/players";
import { bggPageUrl, durationText, PLAY_MODE_LABELS, playersText } from "@/lib/domain/game-form";
import { starsText, summarizeRatings } from "@/lib/domain/ratings";
import { ATTACHMENTS_BUCKET, coverUrl, signedUrls } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { CHART, Icon } from "@/components/icon";
import { OwnerFaces } from "@/components/owners";
import { toOwners } from "@/lib/data/explore";
import { CoverEditor, DeleteGameButton, ExpansionList, RatingPicker, RetireGameButton } from "./game-detail-forms";
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
      .select("*, game_owners(players(id, display_name, avatar_url)), ratings(player_id, stars), expansions(id, name, bgg_id, retired_at, created_by, expansion_owners(players(id, display_name, avatar_url)))")
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
    return a.kind === "link"
      ? { id: a.id, kind: "link", url: a.url! }
      : { id: a.id, kind: "file", url: attachmentUrls.get(a.path!) ?? null, fileName: a.file_name!, sizeBytes: a.size_bytes! };
  });
  const names = new Map(members.map((m) => [m.id, m.display_name]));
  const avatars = new Map(members.map((m) => [m.id, m.avatar_url]));
  const ratings = summarizeRatings(game.ratings.map((r) => ({ playerId: r.player_id, stars: r.stars })), names);
  const myStars = game.ratings.find((r) => r.player_id === member.playerId)?.stars ?? 0;
  const owners = toOwners(game.game_owners);

  const stats = [
    { label: "Jugadores", value: playersText(game.min_players, game.max_players)?.replace(" jugadores", "") },
    { label: "Duración", value: durationText(game.min_duration, game.max_duration) },
    { label: "Complejidad", value: game.complexity !== null ? `${Number(game.complexity).toLocaleString("es-ES")}/5` : null },
  ].filter((f) => f.value);

  return (
    <div className="space-y-6">
      {/* The buttons take the whole width under the header on a phone, and sit beside the cover from `sm` up. */}
      <section className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-4 sm:gap-x-8">
        <div className="sm:row-span-2">
          <CoverEditor gameId={game.id} url={coverUrl(game, signed)} name={game.name} hasOwnCover={Boolean(game.cover_path)} className="size-28 text-5xl shadow-hard-lg sm:size-48 sm:text-7xl" />
        </div>
        <div className="min-w-0 space-y-3 sm:self-end">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-ink px-2.5 py-0.5 font-display text-xs text-teal">{PLAY_MODE_LABELS[game.default_play_mode]}</span>
            {game.retired_at && <span className="chip border-dashed text-muted">Retirado</span>}
            {game.lower_score_wins && <span className="chip">Gana la puntuación más baja</span>}
          </div>
          <h1 className="text-3xl break-words sm:text-5xl">{game.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-soft">
            <OwnerFaces owners={owners} withNames on="background" />
            {ratings.average !== null && (
              <span>
                <span className="font-bold text-accent">★ {ratings.average.toLocaleString("es-ES")}</span> <span className="text-muted">({ratings.count})</span>
              </span>
            )}
            <Link href={`/stats?game=${game.id}`} aria-label="Estadísticas" title="Estadísticas" className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-muted hover:bg-accent-soft hover:text-foreground">
              <Icon d={CHART} className="size-5" />
            </Link>
          </div>
        </div>
        <div className="actions col-span-2 sm:col-span-1 sm:col-start-2 sm:self-start">
          <Link href={`/games/${game.id}/edit`} className="btn-secondary">
            Editar
          </Link>
          <RetireGameButton gameId={game.id} retired={game.retired_at !== null} />
          <DeleteGameButton gameId={game.id} />
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-6">
          {game.notes && <p className="text-lg whitespace-pre-line text-soft">{game.notes}</p>}

          {game.bgg_id !== null &&
            (bggEnabled() ? (
              <Suspense fallback={<p className="card text-sm text-muted">Consultando BoardGameGeek…</p>}>
                <BggInfo bggId={game.bgg_id} />
              </Suspense>
            ) : (
              <PoweredByBgg href={bggPageUrl(game.bgg_id)} label="Ver en BoardGameGeek" />
            ))}

          <section className="card space-y-3">
            <h2>Tu valoración</h2>
            <RatingPicker gameId={game.id} stars={myStars} />
            {ratings.breakdown.length > 0 && (
              <ul className="space-y-1 text-sm">
                {ratings.breakdown.map((r) => (
                  <li key={r.playerId} className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar name={r.name} url={avatars.get(r.playerId) ?? null} />
                      <span className="truncate">{r.name}</span>
                    </span>
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
              members={members}
              expansions={game.expansions.map((e) => ({
                id: e.id,
                name: e.name,
                bggId: e.bgg_id,
                retired: e.retired_at !== null,
                owners: toOwners(e.expansion_owners),
              }))}
            />
          </section>

        </div>
        <aside className="space-y-6">
          <section className="card space-y-3">
            <h2>Ficheros y enlaces</h2>
            <Attachments gameId={game.id} items={attachmentItems} />
          </section>

        </aside>
      </div>
    </div>
  );
}
