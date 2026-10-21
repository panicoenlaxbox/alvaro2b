export type Rating = { playerId: string; stars: number };

export type RatingSummary = {
  average: number | null;
  count: number;
  /** One entry per Member who rated, by name: changing a rating never moves its row. */
  breakdown: { playerId: string; name: string; stars: number }[];
};

export function summarizeRatings(ratings: Rating[], names: Map<string, string>): RatingSummary {
  if (ratings.length === 0) return { average: null, count: 0, breakdown: [] };

  const total = ratings.reduce((sum, r) => sum + r.stars, 0);
  const breakdown = ratings
    .map((r) => ({ playerId: r.playerId, name: names.get(r.playerId) ?? "?", stars: r.stars }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return { average: Math.round((total / ratings.length) * 10) / 10, count: ratings.length, breakdown };
}

/** "★★★☆☆" for a whole number of stars out of five. */
export function starsText(stars: number): string {
  const full = Math.max(0, Math.min(5, Math.round(stars)));
  return "★".repeat(full) + "☆".repeat(5 - full);
}
