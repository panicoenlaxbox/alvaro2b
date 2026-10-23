import Link from "next/link";
import { Faces } from "@/components/owners";
import type { SessionSummary } from "@/lib/data/sessions";
import { formatSessionDate } from "@/lib/domain/session";

/** Heads what belongs to a Session (its Photos, a Play, a Poll): its date, name, place, Games and Attendees. No Session means the Album. */
export function SessionHeader({ session }: { session: SessionSummary | null }) {
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
          {/* Wraps under the date on a phone instead of squeezing into a narrow column beside it. */}
          <p className="min-w-0 flex-[1_1_12rem] text-sm text-muted">
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
          <Faces people={session.attendees} prefix="Con" on="background" />
        </>
      )}
    </header>
  );
}
