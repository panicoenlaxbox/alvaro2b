/* eslint-disable @next/next/no-img-element -- thumbnails are short-lived signed URLs */
import Link from "next/link";

export function PhotoGrid({ photos }: { photos: { id: string; thumbUrl: string | null; caption: string | null }[] }) {
  if (photos.length === 0) return <p className="text-sm text-muted">Aún no hay fotos.</p>;
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {photos.map((p) => (
        <li key={p.id}>
          <Link href={`/photos/${p.id}`} className="block aspect-square overflow-hidden rounded-xl border-[3px] border-ink bg-card">
            {p.thumbUrl && <img src={p.thumbUrl} alt={p.caption ?? ""} loading="lazy" className="size-full object-cover" />}
          </Link>
        </li>
      ))}
    </ul>
  );
}
