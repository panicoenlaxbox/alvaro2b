import type { Owner } from "@/lib/data/explore";
import { Avatar } from "./avatar";

const list = new Intl.ListFormat("es", { type: "conjunction" });

/** "Ana, Bruno y Carla" */
export function ownerNames(owners: { name: string }[]): string {
  return list.format(owners.map((o) => o.name));
}

type Face = { id?: string; name: string; avatarUrl: string | null };

const RING = { card: "ring-card", paper: "ring-paper", background: "ring-background" } as const;

/**
 * People's faces, overlapping like a hand of cards: the one look for every group of Players.
 * The ring takes the colour behind it so the faces read as cut out. `prefix` words the names ("Con Ana y Bruno").
 */
export function Faces({ people, prefix, on = "card", withNames = false }: { people: Face[]; prefix: string; on?: keyof typeof RING; withNames?: boolean }) {
  if (people.length === 0) return null;
  const names = ownerNames(people);
  return (
    <span className="inline-flex shrink-0 items-center gap-2" title={`${prefix} ${names}`}>
      <span className="flex -space-x-2" aria-hidden={withNames}>
        {people.map((p) => (
          <span key={p.id ?? p.name} className={`inline-flex rounded-full ring-2 ${RING[on]}`}>
            <Avatar name={p.name} url={p.avatarUrl} />
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

/** The owners' faces; nothing when nobody owns it. */
export function OwnerFaces({ owners, withNames = false, on }: { owners: Owner[]; withNames?: boolean; on?: keyof typeof RING }) {
  return <Faces people={owners} prefix="De" withNames={withNames} on={on} />;
}
