/** A Player as a face and a name: an owner, an Attendee, someone tagged or playing. */
export type Person = { id: string; name: string; avatarUrl: string | null };

/** An owner as the catalogue shows it. */
export type Owner = Person;

/** Sorts people by name, in place, the way every list of faces is ordered. */
export const byName = <T extends { name: string }>(people: T[]) => people.sort((a, b) => a.name.localeCompare(b.name, "es"));

/** People as Supabase returns them through a join table (`x(players(id, display_name, avatar_url))`), sorted by name. */
export function toPeople(rows: { players: { id: string; display_name: string; avatar_url: string | null } | null }[]): Person[] {
  return byName(rows.flatMap((r) => (r.players ? [{ id: r.players.id, name: r.players.display_name, avatarUrl: r.players.avatar_url }] : [])));
}
