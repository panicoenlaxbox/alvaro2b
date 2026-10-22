import { XMLParser } from "fast-xml-parser";
import type { GameInput, PlayMode } from "@/lib/domain/game-form";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  isArray: (name, _path, _leaf, isAttribute) => !isAttribute && ["item", "name", "link", "poll", "results", "result"].includes(name),
});

type Attr = { value?: string | number };
const list = <T>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const num = (v: unknown): number | null => {
  const n = Number(typeof v === "object" && v !== null ? (v as Attr).value : v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export type BggSearchResult = { id: number; name: string; year: number | null };

/** Parses /xmlapi2/search results. */
export function parseSearch(xml: string): BggSearchResult[] {
  const doc = parser.parse(xml);
  return list(doc?.items?.item)
    .map((item: Record<string, unknown>) => {
      const names = list(item.name as { type?: string; value?: string }[]);
      const primary = names.find((n) => n.type === "primary") ?? names[0];
      return { id: Number(item.id), name: String(primary?.value ?? ""), year: num(item.yearpublished) };
    })
    .filter((r) => r.id > 0 && r.name);
}

export type BggThing = {
  id: number;
  name: string;
  year: number | null;
  image: string | null;
  description: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  weight: number | null;
  averageRating: number | null;
  bestPlayers: string[];
  mechanics: string[];
  isExpansion: boolean;
};

/** BGG descriptions come HTML-escaped, with &#10; for line breaks. */
export function decodeDescription(text: string): string {
  return text
    .replace(/&#10;/g, "\n")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Player counts the community votes "Best" for, from the suggested_numplayers poll. */
function bestPlayerCounts(polls: Record<string, unknown>[]): string[] {
  const poll = polls.find((p) => p.name === "suggested_numplayers");
  if (!poll) return [];
  return list(poll.results as Record<string, unknown>[])
    .filter((r) => {
      const votes = Object.fromEntries(
        list(r.result as { value: string; numvotes: string | number }[]).map((v) => [v.value, Number(v.numvotes)]),
      );
      const best = votes["Best"] ?? 0;
      return best > 0 && best >= (votes["Recommended"] ?? 0) && best >= (votes["Not Recommended"] ?? 0);
    })
    .map((r) => String(r.numplayers));
}

/** Parses /xmlapi2/thing?stats=1 for one item. */
export function parseThing(xml: string): BggThing | null {
  const doc = parser.parse(xml);
  const item = list(doc?.items?.item)[0] as Record<string, unknown> | undefined;
  if (!item) return null;

  const names = list(item.name as { type?: string; value?: string }[]);
  const links = list(item.link as { type: string; value: string }[]);
  const ratings = (item.statistics as { ratings?: Record<string, unknown> } | undefined)?.ratings ?? {};
  const description = typeof item.description === "string" ? decodeDescription(item.description) : null;
  const image = typeof item.image === "string" && item.image.startsWith("https://") ? item.image.trim() : null;

  return {
    id: Number(item.id),
    name: String((names.find((n) => n.type === "primary") ?? names[0])?.value ?? ""),
    year: num(item.yearpublished),
    image,
    description: description || null,
    minPlayers: num(item.minplayers),
    maxPlayers: num(item.maxplayers),
    minPlaytime: num(item.minplaytime),
    maxPlaytime: num(item.maxplaytime),
    weight: num(ratings.averageweight),
    averageRating: num(ratings.average),
    bestPlayers: bestPlayerCounts(list(item.poll as Record<string, unknown>[])),
    mechanics: links.filter((l) => l.type === "boardgamemechanic").map((l) => l.value),
    isExpansion: item.type === "boardgameexpansion",
  };
}

/** Our own fields from a BGG item: only what feeds the Catalog filters, all editable. */
export function toGameDefaults(thing: BggThing): Partial<GameInput> & { bgg_image_url: string | null } {
  const mechanics = thing.mechanics.map((m) => m.toLowerCase());
  const mode: PlayMode = mechanics.includes("cooperative game")
    ? "cooperative"
    : mechanics.includes("team-based game")
      ? "team"
      : "competitive";
  return {
    name: thing.name,
    year: thing.year,
    min_players: thing.minPlayers,
    max_players: thing.maxPlayers,
    min_duration: thing.minPlaytime,
    max_duration: thing.maxPlaytime ?? thing.minPlaytime,
    complexity: thing.weight === null ? null : Math.min(5, Math.max(1, Math.round(thing.weight * 10) / 10)),
    default_play_mode: mode,
    bgg_id: thing.id,
    bgg_image_url: thing.image,
  };
}
