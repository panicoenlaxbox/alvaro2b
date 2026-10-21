import "server-only";
import { parseSearch, parseThing, type BggSearchResult, type BggThing } from "./parse";

// BoardGameGeek XML API2 (ADR 0002). Optional: without BGG_TOKEN every function returns nothing
// and the app falls back to adding Games by hand. The token must go to the bare domain.
const BASE = "https://boardgamegeek.com/xmlapi2";
const WEEK = 7 * 24 * 60 * 60;
const DAY = 24 * 60 * 60;

export function bggEnabled(): boolean {
  return Boolean(process.env.BGG_TOKEN);
}

async function fetchXml(path: string, revalidate: number): Promise<string | null> {
  const token = process.env.BGG_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      // Server-side cache, as BGG asks: the BGG info block is refreshed about once a week.
      next: { revalidate, tags: ["bgg"] },
      signal: AbortSignal.timeout(8000),
    });
    // 202 means BGG queued the request; the next visit will usually get it.
    if (res.status !== 200) {
      if (res.status !== 202) console.error(`BGG request failed with ${res.status}`, path);
      return null;
    }
    return await res.text();
  } catch (error) {
    console.error("BGG request failed", path, error);
    return null;
  }
}

export async function searchBggGames(query: string): Promise<BggSearchResult[] | null> {
  const q = query.trim();
  if (q.length < 2) return [];
  const xml = await fetchXml(`/search?type=boardgame&query=${encodeURIComponent(q)}`, DAY);
  return xml === null ? null : parseSearch(xml).slice(0, 20);
}

export async function getBggThing(id: number): Promise<BggThing | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const xml = await fetchXml(`/thing?id=${id}&stats=1`, WEEK);
  return xml === null ? null : parseThing(xml);
}
