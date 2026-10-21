import type { Metadata } from "next";
import { requireMember } from "@/lib/auth";
import { listPhotos } from "@/lib/data/photos";
import { groupBySession } from "@/lib/domain/photos";
import { PhotoGrid } from "@/components/photo-grid";
import { SessionHeader } from "@/components/session-header";
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
          <SessionHeader session={g.session} />
          <PhotoGrid photos={g.photos} />
        </section>
      ))}
    </div>
  );
}
