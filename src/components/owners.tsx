import type { Owner } from "@/lib/data/explore";
import { Avatar } from "./avatar";

const list = new Intl.ListFormat("es", { type: "conjunction" });

/** "Ana, Bruno y Carla" */
export function ownerNames(owners: Owner[]): string {
  return list.format(owners.map((o) => o.name));
}

/** The owners' faces, overlapping like a hand of cards; nothing when nobody owns it. */
export function OwnerFaces({ owners, size = 30, withNames = false }: { owners: Owner[]; size?: number; withNames?: boolean }) {
  if (owners.length === 0) return null;
  const names = ownerNames(owners);
  return (
    <span className="inline-flex items-center gap-2" title={`De ${names}`}>
      <span className="flex -space-x-2" aria-hidden={withNames}>
        {owners.map((o) => (
          <span key={o.id} className="rounded-full border-2 border-ink">
            <Avatar name={o.name} url={o.avatarUrl} size={size} />
          </span>
        ))}
      </span>
      {withNames ? <span>De {names}</span> : <span className="sr-only">De {names}</span>}
    </span>
  );
}
