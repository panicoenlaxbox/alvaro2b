import type { Owner } from "@/lib/data/people";
import { Avatar } from "./avatar";

const list = new Intl.ListFormat("es", { type: "conjunction" });

/** `maybe`: an Attendee who might come, shown faded (a "?" would hide under the next face). */
type Face = { id?: string; name: string; avatarUrl: string | null; maybe?: boolean };

const RING = { card: "ring-card", paper: "ring-paper", background: "ring-background" } as const;

/**
 * People's faces, overlapping like a hand of cards: the one look for every group of Players.
 * The ring takes the colour behind it so the faces read as cut out. `prefix` words the names ("Con Ana y Bruno").
 */
export function Faces({ people, prefix, on = "card", withNames = false }: { people: Face[]; prefix: string; on?: keyof typeof RING; withNames?: boolean }) {
  if (people.length === 0) return null;
  const names = list.format(people.map((p) => (p.maybe ? `${p.name} (quizá)` : p.name)));
  return (
    // With names the text may wrap; the faces never shrink.
    <span className={`inline-flex items-center gap-2 ${withNames ? "min-w-0" : "shrink-0"}`} title={`${prefix} ${names}`}>
      <span className="flex shrink-0 -space-x-2" aria-hidden={withNames}>
        {people.map((p) => (
          <span key={p.id ?? p.name} className={`inline-flex rounded-full ring-2 ${RING[on]}`}>
            <span className={p.maybe ? "inline-flex opacity-40" : "inline-flex"}>
              <Avatar name={p.name} url={p.avatarUrl} />
            </span>
          </span>
        ))}
      </span>
      {withNames ? (
        <span>
          {prefix} {names}
        </span>
      ) : (
        <span className="sr-only">
          {prefix} {names}
        </span>
      )}
    </span>
  );
}

/** The "?" on the face of an Attendee who might come, in the Player picker, where faded means not picked. */
export function MaybeMark() {
  return (
    <span
      aria-hidden
      className="absolute -right-1 -bottom-1 inline-flex size-5 items-center justify-center rounded-full border-2 border-ink bg-accent font-display text-xs leading-none text-ink"
    >
      ?
    </span>
  );
}

/** The owners' faces; nothing when nobody owns it. */
export function OwnerFaces({ owners, withNames = false, on }: { owners: Owner[]; withNames?: boolean; on?: keyof typeof RING }) {
  return <Faces people={owners} prefix="De" withNames={withNames} on={on} />;
}
