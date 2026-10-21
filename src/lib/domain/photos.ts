/** Longest Photo caption; the form input uses it too. */
export const PHOTO_CAPTION_MAX = 500;

type SessionRef = { id: string; date: string };

/**
 * Photos split for the Photos page: the Album (Photos of no Session) first, where new uploads land,
 * then each Session, newest first. Each group keeps the Photos in the order given.
 */
export function groupBySession<T extends { session: SessionRef | null }>(photos: T[]): { session: NonNullable<T["session"]> | null; photos: T[] }[] {
  type S = NonNullable<T["session"]>;
  const bySession = new Map<string, { session: S; photos: T[] }>();
  const album: T[] = [];
  for (const photo of photos) {
    if (!photo.session) {
      album.push(photo);
      continue;
    }
    const group = bySession.get(photo.session.id) ?? { session: photo.session as S, photos: [] };
    group.photos.push(photo);
    bySession.set(photo.session.id, group);
  }
  const sessions = [...bySession.values()].sort((a, b) => b.session.date.localeCompare(a.session.date) || b.session.id.localeCompare(a.session.id));
  return album.length > 0 ? [{ session: null, photos: album }, ...sessions] : sessions;
}
