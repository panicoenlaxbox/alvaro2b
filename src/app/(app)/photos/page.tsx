import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { listPhotos } from "@/lib/data/photos";
import { groupBySession } from "@/lib/domain/photos";
import { formatSessionDate } from "@/lib/domain/session";
import { Avatar } from "@/components/avatar";
import { PhotoGrid } from "@/components/photo-grid";
import { PhotoUploader } from "@/components/photo-uploader";

export const metadata: Metadata = { title: "Fotos" };

export default async function PhotosPage() {
  await requireMember();
  const groups = groupBySession(await listPhotos());

  return (
    <div className="space-y-5">
      <h1 className="text-3xl sm:text-4xl">Fotos</h1>
      <PhotoUploader sessionId={null} />
      {groups.map((g) => (
        <section key={g.session?.id ?? "album"} className="space-y-3">
          <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-dashed border-border pb-2">
            <h2 className="text-lg">
              {g.session ? (
                <Link href={`/sessions/${g.session.id}`} className="underline">
                  {formatSessionDate(g.session.date)}
                </Link>
              ) : (
                "Álbum"
              )}
            </h2>
            {g.session && (
              <>
                <p className="min-w-0 flex-1 text-sm text-muted">
                  {[g.session.name, g.session.place].filter(Boolean).join(" · ")}
                  {(g.session.name || g.session.place) && g.session.games.length > 0 && " · "}
                  {g.session.games.map((game, i) => (
                    <span key={game.id}>
                      {i > 0 && ", "}
                      <Link href={`/games/${game.id}`} className="underline hover:text-foreground">
                        {game.name}
                      </Link>
                    </span>
                  ))}
                </p>
                {g.session.attendees.length > 0 && (
                  <span className="flex shrink-0 -space-x-1.5">
                    <span className="sr-only">Asistentes: {g.session.attendees.map((a) => a.name).join(", ")}</span>
                    {g.session.attendees.map((a) => (
                      <span key={a.name} title={a.name} className="inline-flex rounded-full ring-2 ring-background">
                        <Avatar name={a.name} url={a.avatarUrl} size={24} />
                      </span>
                    ))}
                  </span>
                )}
              </>
            )}
          </header>
          <PhotoGrid photos={g.photos} />
        </section>
      ))}
    </div>
  );
}
