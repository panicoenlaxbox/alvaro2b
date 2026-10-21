/* eslint-disable @next/next/no-img-element -- thumbnails are short-lived signed URLs */
import Link from "next/link";
import type { PhotoThumb } from "@/lib/data/photos";
import { Avatar } from "./avatar";

/** A slight, stable tilt per position, so the grid looks like Polaroids dropped on the table. */
const TILTS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-[0.5deg]", "-rotate-[1.5deg]"];

/** Caption and tagged Players go in the Polaroid's bottom margin, so every Photo keeps the same size. */
export function PhotoGrid({ photos }: { photos: Pick<PhotoThumb, "id" | "thumbUrl" | "caption" | "tagged">[] }) {
  if (photos.length === 0) return <p className="text-sm text-muted">Aún no hay fotos.</p>;
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-5 py-2 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4">
      {photos.map((p, i) => (
        <li key={p.id}>
          <Link
            href={`/photos/${p.id}`}
            className={`polaroid relative block transition-transform hover:z-10 hover:scale-105 hover:rotate-0 focus-visible:rotate-0 ${TILTS[i % TILTS.length]}`}
          >
            <span className="block aspect-square overflow-hidden border-2 border-ink bg-card">
              {p.thumbUrl && <img src={p.thumbUrl} alt={p.caption ?? ""} loading="lazy" className="size-full object-cover" />}
            </span>
            {(p.caption || p.tagged.length > 0) && (
              <span className="absolute inset-x-2 bottom-0 flex h-7 items-center gap-2 sm:inset-x-3 sm:h-10">
                <span className="min-w-0 flex-1 truncate font-hand text-lg leading-none text-ink sm:text-2xl">{p.caption}</span>
                {p.tagged.length > 0 && (
                  <span className="flex shrink-0 -space-x-1.5" aria-label={`Salen: ${p.tagged.map((t) => t.name).join(", ")}`}>
                    {p.tagged.slice(0, 3).map((t) => (
                      <span key={t.name} className="inline-flex rounded-full ring-2 ring-paper">
                        <Avatar name={t.name} url={t.avatarUrl} size={20} />
                      </span>
                    ))}
                    {p.tagged.length > 3 && (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-ink text-[0.625rem] font-bold text-paper ring-2 ring-paper">
                        +{p.tagged.length - 3}
                      </span>
                    )}
                  </span>
                )}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
