"use server";

import { requireMember } from "@/lib/auth";
import { searchBggGames } from "@/lib/bgg/client";
import type { BggSearchResult } from "@/lib/bgg/parse";

export async function searchBgg(query: string): Promise<{ results?: BggSearchResult[]; error?: string }> {
  await requireMember();
  const results = await searchBggGames(query);
  if (results === null) return { error: "BoardGameGeek no responde ahora mismo. Puedes añadir el juego a mano." };
  return { results };
}
