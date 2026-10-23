import Link from "next/link";
import { formatSessionDate } from "@/lib/domain/session";
import type { Person } from "@/lib/data/people";
import { DateTile } from "./date-tile";
import { Faces } from "./owners";

export function SessionCard({
  session,
}: {
  session: { id: string; date: string; time: string | null; name: string | null; place: string | null; attendees: (Person & { maybe: boolean })[] };
}) {
  // When, where and who: the date is on the tile, the time and place beside it, the Attendees below.
  const details = [session.time, session.place].filter(Boolean);

  return (
    <Link
      href={`/sessions/${session.id}`}
      className="card flex items-center gap-3 p-3 transition-transform hover:-translate-y-0.5"
    >
      <DateTile date={session.date} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-bold leading-snug first-letter:uppercase">{session.name ?? formatSessionDate(session.date)}</p>
        {session.name && <p className="sr-only">{formatSessionDate(session.date)}</p>}
        {details.length > 0 && <p className="text-sm text-muted">{details.join(" · ")}</p>}
        <Faces people={session.attendees} prefix="Con" />
      </div>
    </Link>
  );
}
