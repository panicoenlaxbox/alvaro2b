import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { listPhotos } from "@/lib/data/photos";
import { groupBySession } from "@/lib/domain/photos";
import { formatSessionDate } from "@/lib/domain/session";
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
      {groups.length === 0 && <p className="text-sm text-muted">Aún no hay fotos.</p>}
      {groups.map((g) => (
        <section key={g.session?.id ?? "album"} className="space-y-2">
          <h2 className="text-lg">
            {g.session ? (
              <Link href={`/sessions/${g.session.id}`} className="inline-block underline first-letter:uppercase">
                {formatSessionDate(g.session.date)}
              </Link>
            ) : (
              "Álbum"
            )}
          </h2>
          <PhotoGrid photos={g.photos} />
        </section>
      ))}
    </div>
  );
}
