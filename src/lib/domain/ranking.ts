/**
 * Standard competition ranking ("1224"): tied values share a position and the next position
 * skips accordingly. `better(a, b)` is negative when a ranks above b. The sort is stable, so items
 * that tie keep their input order.
 */
export function competitionRanks<T>(items: T[], value: (item: T) => number, better: (a: number, b: number) => number): Map<T, number> {
  const sorted = [...items].sort((a, b) => better(value(a), value(b)));
  const ranks = new Map<T, number>();
  sorted.forEach((item, i) => {
    const prev = sorted[i - 1];
    ranks.set(item, prev !== undefined && value(prev) === value(item) ? ranks.get(prev)! : i + 1);
  });
  return ranks;
}
