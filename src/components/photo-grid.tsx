/* eslint-disable @next/next/no-img-element -- thumbnails are short-lived signed URLs */
import Link from "next/link";

/** A slight, stable tilt per position, so the grid looks like Polaroids dropped on the table. */
const TILTS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-[0.5deg]", "-rotate-[1.5deg]"];

export function PhotoGrid({ photos }: { photos: { id: string; thumbUrl: string | null; caption: string | null }[] }) {
  if (photos.length === 0) return <p className="text-sm text-muted">Aún no hay fotos.</p>;
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-5 py-2 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4">
      {photos.map((p, i) => (
        <li key={p.id}>
          <Link
            href={`/photos/${p.id}`}
            className={`polaroid block transition-transform hover:z-10 hover:scale-105 hover:rotate-0 focus-visible:rotate-0 ${TILTS[i % TILTS.length]}`}
          >
            <span className="block aspect-square overflow-hidden border-2 border-ink bg-card">
              {p.thumbUrl && <img src={p.thumbUrl} alt={p.caption ?? ""} loading="lazy" className="size-full object-cover" />}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
