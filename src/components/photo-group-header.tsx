import Link from "next/link";
import { Avatar } from "@/components/avatar";
import type { PhotoSession } from "@/lib/data/photos";
import { formatSessionDate } from "@/lib/domain/session";

/** Heads a Session's Photos: its date, name, place, Games and Attendees. No Session means the Album. */
export function PhotoGroupHeader({ session }: { session: PhotoSession | null }) {
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-dashed border-border pb-2">
      <h2 className="text-lg">
        {session ? (
          <Link href={`/sessions/${session.id}`} className="underline">
            {formatSessionDate(session.date)}
          </Link>
        ) : (
          "Álbum"
        )}
      </h2>
      {session && (
        <>
          <p className="min-w-0 flex-1 text-sm text-muted">
            {[session.name, session.place].filter(Boolean).join(" · ")}
            {(session.name || session.place) && session.games.length > 0 && " · "}
            {session.games.map((game, i) => (
              <span key={game.id}>
                {i > 0 && ", "}
                <Link href={`/games/${game.id}`} className="underline hover:text-foreground">
                  {game.name}
                </Link>
              </span>
            ))}
          </p>
          {session.attendees.length > 0 && (
            <span className="flex shrink-0 -space-x-1.5">
              <span className="sr-only">Asistentes: {session.attendees.map((a) => a.name).join(", ")}</span>
              {session.attendees.map((a) => (
                <span key={a.name} title={a.name} className="inline-flex rounded-full ring-2 ring-background">
                  <Avatar name={a.name} url={a.avatarUrl} size={24} />
                </span>
              ))}
            </span>
          )}
        </>
      )}
    </header>
  );
}
