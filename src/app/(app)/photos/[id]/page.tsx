/* eslint-disable @next/next/no-img-element -- full Photos are short-lived signed URLs */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { listPlayers } from "@/lib/data/players";
import { formatSessionDate } from "@/lib/domain/session";
import { MEDIA_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { DeletePhotoButton, PhotoEditor } from "./photo-forms";

export const metadata: Metadata = { title: "Foto" };

export default async function PhotoPage({ params }: PageProps<"/photos/[id]">) {
  const member = await requireMember();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: photo }, players] = await Promise.all([
    supabase
      .from("photos")
      .select("id, session_id, play_id, path, caption, width, height, uploaded_by, sessions(date, plays(id, games(name))), photo_tags(player_id)")
      .eq("id", id)
      .maybeSingle(),
    listPlayers(),
  ]);
  if (!photo) notFound();

  const [{ data: view }, { data: download }] = await Promise.all([
    supabase.storage.from(MEDIA_BUCKET).createSignedUrl(photo.path, 3600),
    supabase.storage.from(MEDIA_BUCKET).createSignedUrl(photo.path, 3600, { download: true }),
  ]);
  const names = new Map(players.map((p) => [p.id, p.display_name]));
  const tagged = photo.photo_tags.map((t) => t.player_id);
  const plays = photo.sessions?.plays.map((p) => ({ id: p.id, name: p.games?.name ?? "?" })) ?? [];
  const playName = plays.find((p) => p.id === photo.play_id)?.name;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {photo.session_id && photo.sessions ? (
          <Link href={`/sessions/${photo.session_id}`} className="inline-block underline first-letter:uppercase">
            {formatSessionDate(photo.sessions.date)}
          </Link>
        ) : (
          <Link href="/photos" className="underline">
            Álbum
          </Link>
        )}
      </p>

      {view?.signedUrl && (
        <figure className="polaroid mx-auto max-w-3xl -rotate-1">
          <img
            src={view.signedUrl}
            alt={photo.caption ?? "Foto del grupo"}
            width={photo.width}
            height={photo.height}
            className="h-auto w-full border-2 border-ink"
          />
          {photo.caption && <figcaption className="px-1 pt-3 text-lg text-ink">{photo.caption}</figcaption>}
        </figure>
      )}

      {!view?.signedUrl && photo.caption && <p>{photo.caption}</p>}
      {(tagged.length > 0 || playName) && (
        <p className="text-sm text-muted">
          {tagged.length > 0 && `Salen: ${tagged.map((t) => names.get(t)).join(", ")}`}
          {tagged.length > 0 && playName && " · "}
          {playName && `Partida de ${playName}`}
        </p>
      )}

      <details className="card">
        <summary className="cursor-pointer font-semibold">Editar pie, etiquetas y partida</summary>
        <div className="mt-3">
          <PhotoEditor photoId={photo.id} caption={photo.caption} players={players} tagged={tagged} plays={plays} playId={photo.play_id} />
        </div>
      </details>

      <div className="flex flex-wrap gap-2">
        {download?.signedUrl && (
          <a href={download.signedUrl} className="btn-secondary">
            Descargar
          </a>
        )}
        {(member.isAdmin || photo.uploaded_by === member.userId) && <DeletePhotoButton photoId={photo.id} />}
      </div>
    </div>
  );
}
