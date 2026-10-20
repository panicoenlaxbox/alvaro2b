import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { listPhotos } from "@/lib/data/photos";
import { PhotoGrid } from "@/components/photo-grid";
import { PhotoUploader } from "@/components/photo-uploader";

export const metadata: Metadata = { title: "Fotos" };

export default async function PhotosPage({ searchParams }: PageProps<"/photos">) {
  await requireMember();
  const { view } = await searchParams;
  const all = view === "all";
  const photos = await listPhotos(all ? undefined : null);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl sm:text-4xl">Fotos</h1>
      <nav className="grid grid-cols-2 gap-2" aria-label="Qué fotos ver">
        <Link href="/photos" aria-current={!all ? "page" : undefined} className={!all ? "btn-primary" : "btn-secondary"}>
          Álbum
        </Link>
        <Link href="/photos?view=all" aria-current={all ? "page" : undefined} className={all ? "btn-primary" : "btn-secondary"}>
          Todas
        </Link>
      </nav>
      {all ? (
        <p className="text-sm text-muted">Todas las fotos, de las sesiones y del álbum.</p>
      ) : (
        <>
          <p className="text-sm text-muted">Fotos del grupo que no son de ninguna sesión. Las de cada sesión se suben desde la sesión.</p>
          <PhotoUploader sessionId={null} />
        </>
      )}
      <PhotoGrid photos={photos} />
    </div>
  );
}
