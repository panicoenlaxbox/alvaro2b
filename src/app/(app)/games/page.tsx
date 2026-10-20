import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { durationText, playersText } from "@/lib/domain/game-form";
import { coverUrl, signedUrls } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "@/components/cover";

export const metadata: Metadata = { title: "Juegos" };

export default async function GamesPage({ searchParams }: PageProps<"/games">) {
  await requireMember();
  const { retired } = await searchParams;
  const showRetired = retired === "1";

  const supabase = await createClient();
  let query = supabase
    .from("games")
    .select("id, name, min_players, max_players, min_duration, max_duration, cover_path, bgg_image_url, retired_at, ratings(stars)")
    .order("name");
  query = showRetired ? query.not("retired_at", "is", null) : query.is("retired_at", null);
  const { data: games } = await query;
  const signed = await signedUrls((games ?? []).map((g) => g.cover_path));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{showRetired ? "Juegos retirados" : "Juegos"}</h1>
        <Link href="/games/new" className="btn-primary">
          Añadir
        </Link>
      </div>

      <ul className="space-y-2">
        {(games ?? []).map((g) => {
          const avg = g.ratings.length ? g.ratings.reduce((s, r) => s + r.stars, 0) / g.ratings.length : null;
          const details = [playersText(g.min_players, g.max_players), durationText(g.min_duration, g.max_duration)].filter(Boolean);
          return (
            <li key={g.id}>
              <Link href={`/games/${g.id}`} className="card flex items-center gap-3 p-3">
                <Cover url={coverUrl(g, signed)} name={g.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{g.name}</p>
                  <p className="truncate text-sm text-muted">{details.join(" · ") || "Sin datos"}</p>
                </div>
                {avg !== null && <span className="text-sm font-medium text-accent">★ {avg.toFixed(1)}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      {(games ?? []).length === 0 && <p className="text-muted">{showRetired ? "No hay juegos retirados." : "Aún no hay juegos. ¡Añade el primero!"}</p>}

      <Link href={showRetired ? "/games" : "/games?retired=1"} className="block text-center text-sm text-muted underline">
        {showRetired ? "Volver al catálogo" : "Ver juegos retirados"}
      </Link>
    </div>
  );
}
