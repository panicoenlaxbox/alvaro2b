import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { listCatalogGames } from "@/lib/data/explore";
import { listPlayers } from "@/lib/data/players";
import { filterGames, sortGames } from "@/lib/domain/explore";
import { formatDeadline, isPollOpen, needsTieBreak, rankCandidates } from "@/lib/domain/poll";
import { formatSessionDate, todayIso } from "@/lib/domain/session";
import { appUrl, whatsappUrl } from "@/lib/share";
import { createClient } from "@/lib/supabase/server";
import { CandidateActions, ClosePollButton, ProposeForm, SuggestButton } from "./poll-forms";

export const metadata: Metadata = { title: "Votación" };

const SUGGESTION_COUNT = 6;

export default async function PollPage({ params, searchParams }: PageProps<"/polls/[id]">) {
  const member = await requireMember();
  const { id } = await params;
  const { minutes } = await searchParams;
  const supabase = await createClient();

  const [{ data: poll }, players, games] = await Promise.all([
    supabase
      .from("polls")
      .select(
        "id, session_id, allow_veto, closes_at, closed_at, created_by, sessions(date, place, session_attendees(player_id)), " +
          "candidates(id, game_id, added_by, chosen, approvals(player_id)), vetoes(player_id, candidate_id)",
      )
      .eq("id", id)
      .maybeSingle(),
    listPlayers(),
    listCatalogGames(member.playerId),
  ]);
  if (!poll) notFound();

  type PollRow = {
    id: string;
    session_id: string;
    allow_veto: boolean;
    closes_at: string | null;
    closed_at: string | null;
    created_by: string | null;
    sessions: { date: string; place: string | null; session_attendees: { player_id: string }[] } | null;
    candidates: { id: string; game_id: string; added_by: string | null; chosen: boolean; approvals: { player_id: string }[] }[];
    vetoes: { player_id: string; candidate_id: string }[];
  };
  const p = poll as unknown as PollRow;

  const names = new Map(players.map((pl) => [pl.id, pl.display_name]));
  const gameNames = new Map(games.map((g) => [g.id, g.name]));
  const open = isPollOpen({ closesAt: p.closes_at, closedAt: p.closed_at });
  const isCreator = p.created_by === member.userId || member.isAdmin;
  const myVeto = p.vetoes.find((v) => v.player_id === member.playerId)?.candidate_id ?? null;

  const ranked = rankCandidates(
    p.candidates.map((c) => ({
      id: c.id,
      gameId: c.game_id,
      name: gameNames.get(c.game_id) ?? "?",
      approvals: c.approvals.map((a) => a.player_id),
      vetoes: p.vetoes.filter((v) => v.candidate_id === c.id).map((v) => v.player_id),
      chosen: c.chosen,
    })),
  );
  const addedBy = new Map(p.candidates.map((c) => [c.id, c.added_by]));

  // Suggestions (PRD 6): Catalog Games for the Attendees and the time available, best rated first.
  const proposed = new Set(p.candidates.map((c) => c.game_id));
  const attendees = p.sessions?.session_attendees.length ?? 0;
  const maxMinutes = typeof minutes === "string" && Number(minutes) > 0 ? Number(minutes) : undefined;
  const suggestions = sortGames(
    filterGames(games, { players: attendees || undefined, maxMinutes }, todayIso()).filter((g) => !proposed.has(g.id)),
    "rating",
  ).slice(0, SUGGESTION_COUNT);
  const available = games.filter((g) => !g.retired && !proposed.has(g.id));

  const url = `${appUrl()}/polls/${p.id}`;
  const sessionDate = p.sessions ? formatSessionDate(p.sessions.date) : "";

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <Link href={`/sessions/${p.session_id}`} className="inline-block text-sm text-muted underline first-letter:uppercase">
          {sessionDate}
        </Link>
        <h1 className="text-4xl">¿A qué jugamos?</h1>
        <p className="text-sm text-muted">
          {open
            ? p.closes_at
              ? `Abierta hasta el ${formatDeadline(p.closes_at)}.`
              : "Abierta hasta que se cierre a mano."
            : "Votación cerrada."}{" "}
          Marca todo lo que te apetezca{p.allow_veto ? "; puedes vetar un juego" : ""}. Es orientativa.
        </p>
      </section>

      <section className="space-y-2">
        {ranked.length === 0 && <p className="text-muted">Aún no hay candidatos. ¡Propón alguno!</p>}
        {needsTieBreak(ranked) && !open && isCreator && (
          <p className="alert">Hay empate en cabeza: marca los que vamos a jugar.</p>
        )}
        {ranked.map((c) => {
          const mine = c.approvals.includes(member.playerId);
          const share = Math.round((c.approvals.length / Math.max(1, ...ranked.map((r) => r.approvals.length))) * 100);
          return (
            <div key={c.id} className={`card space-y-2 p-3 ${c.leading || c.chosen ? "border-accent" : ""}`}>
              <div className="flex items-center gap-2">
                <span className="w-9 font-display text-lg text-muted">{c.position}.º</span>
                <Link href={`/games/${c.gameId}`} className={`flex-1 font-semibold ${c.vetoed ? "text-muted line-through" : ""}`}>
                  {c.chosen ? "✅ " : ""}
                  {c.name}
                </Link>
                <span className="text-sm font-medium">
                  <span className="font-display text-xl">{c.approvals.length}</span> {c.approvals.length === 1 ? "voto" : "votos"}
                </span>
              </div>
              <div aria-hidden className="h-3.5 overflow-hidden rounded-full border-2 border-ink bg-background">
                <div className={`h-full ${c.leading || c.chosen ? "bg-accent" : "bg-teal"}`} style={{ width: `${share}%` }} />
              </div>
              {(c.approvals.length > 0 || c.vetoes.length > 0) && (
                <p className="text-xs text-muted">
                  {c.approvals.map((a) => names.get(a)).join(", ")}
                  {c.vetoes.length > 0 && ` · Vetado por ${c.vetoes.map((v) => names.get(v)).join(", ")}`}
                </p>
              )}
              <CandidateActions
                pollId={p.id}
                candidateId={c.id}
                approve={open ? mine : undefined}
                veto={open && p.allow_veto ? myVeto === c.id : undefined}
                choose={!open && isCreator ? c.chosen : undefined}
                withdraw={open && (addedBy.get(c.id) === member.playerId || isCreator)}
              />
            </div>
          );
        })}
      </section>

      {open && (
        <section className="card space-y-3">
          <h2>Proponer un juego</h2>
          <ProposeForm pollId={p.id} games={available.map((g) => ({ id: g.id, name: g.name }))} />
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm text-muted">
                  Sugerencias{attendees ? ` para ${attendees}` : ""}
                  {maxMinutes ? ` en ${maxMinutes} min` : ""}
                </h3>
                <form method="get" className="flex items-center gap-1">
                  <input name="minutes" type="number" min={1} placeholder="min" aria-label="Minutos disponibles" defaultValue={maxMinutes ?? ""} className="input w-20 py-1 text-sm" />
                  <button type="submit" className="btn-secondary px-2 py-1 text-xs">
                    Filtrar
                  </button>
                </form>
              </div>
              <ul className="space-y-1">
                {suggestions.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {g.name}
                      {g.averageRating !== null && <span className="text-accent"> ★ {g.averageRating.toLocaleString("es-ES")}</span>}
                    </span>
                    <SuggestButton pollId={p.id} gameId={g.id} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="flex flex-wrap gap-2">
        <a
          href={whatsappUrl(`¿A qué jugamos el ${sessionDate}? Vota aquí: ${url}`)}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
        >
          Compartir por WhatsApp
        </a>
        {open && isCreator && <ClosePollButton pollId={p.id} />}
      </section>
    </div>
  );
}
