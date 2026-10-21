/* eslint-disable @next/next/no-img-element -- full Photos are short-lived signed URLs */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Faces } from "@/components/owners";
import { requireMember } from "@/lib/auth";
import { photoSession } from "@/lib/data/photos";
import { listPlayers } from "@/lib/data/players";
import { PhotoGroupHeader } from "@/components/photo-group-header";
import { MEDIA_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { DeletePhotoButton, PhotoEditor } from "./photo-forms";

export const metadata: Metadata = { title: "Foto" };

export default async function PhotoPage({ params }: PageProps<"/photos/[id]">) {
  await requireMember();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: photo }, players] = await Promise.all([
    supabase
      .from("photos")
      .select("id, session_id, play_id, path, caption, width, height, uploaded_by, sessions(date, name, place, plays(id, created_at, games(id, name)), session_attendees(players(display_name, avatar_url))), photo_tags(player_id)")
      .eq("id", id)
      .maybeSingle(),
    listPlayers(),
  ]);
  if (!photo) notFound();

  const [{ data: view }, { data: download }] = await Promise.all([
    supabase.storage.from(MEDIA_BUCKET).createSignedUrl(photo.path, 3600),
    supabase.storage.from(MEDIA_BUCKET).createSignedUrl(photo.path, 3600, { download: true }),
  ]);
  const byId = new Map(players.map((p) => [p.id, p]));
  const tagged = photo.photo_tags.map((t) => t.player_id);
  const taggedPlayers = tagged.flatMap((t) => byId.get(t) ?? []).sort((a, b) => a.display_name.localeCompare(b.display_name, "es"));
  const plays = photo.sessions?.plays.map((p) => ({ id: p.id, name: p.games?.name ?? "?" })) ?? [];
  const playName = plays.find((p) => p.id === photo.play_id)?.name;

  return (
    <div className="space-y-4">
      <PhotoGroupHeader session={photo.session_id && photo.sessions ? photoSession(photo.session_id, photo.sessions) : null} />

      {view?.signedUrl && (
        <figure className="polaroid mx-auto max-w-3xl -rotate-1">
          <img
            src={view.signedUrl}
            alt={photo.caption ?? "Foto del grupo"}
            width={photo.width}
            height={photo.height}
            className="h-auto w-full border-2 border-ink"
          />
          {(photo.caption || taggedPlayers.length > 0) && (
            <figcaption className="flex items-center gap-3 px-1 pt-3">
              <span className="min-w-0 flex-1 font-hand text-2xl leading-tight text-ink sm:text-3xl">{photo.caption}</span>
              <Faces people={taggedPlayers.map((p) => ({ id: p.id, name: p.display_name, avatarUrl: p.avatar_url }))} prefix="Salen" on="paper" />
            </figcaption>
          )}
        </figure>
      )}

      {!view?.signedUrl && photo.caption && <p>{photo.caption}</p>}
      {playName && <p className="text-sm text-muted">Partida de {playName}</p>}

      <details className="card">
        <summary className="cursor-pointer font-semibold">Editar pie, etiquetas y partida</summary>
        <div className="mt-3">
          <PhotoEditor photoId={photo.id} caption={photo.caption} players={players} tagged={tagged} plays={plays} playId={photo.play_id} />
        </div>
      </details>

      <div className="actions">
        {download?.signedUrl && (
          <a href={download.signedUrl} className="btn-secondary">
            Descargar
          </a>
        )}
        <DeletePhotoButton photoId={photo.id} />
      </div>
    </div>
  );
}
