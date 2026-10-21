import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { listCatalogGames } from "@/lib/data/explore";
import { listPlayers } from "@/lib/data/players";
import { formatDeadline, isPollOpen, needsTieBreak, rankCandidates } from "@/lib/domain/poll";
import { formatSessionDate } from "@/lib/domain/session";
import { appUrl } from "@/lib/share";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { createClient } from "@/lib/supabase/server";
import { Faces } from "@/components/owners";
import { CHECK, Icon } from "@/components/icon";
import { SessionHeader } from "@/components/session-header";
import { sessionSummary } from "@/lib/data/photos";
import { CandidateActions, ClosePollButton, ProposeForm } from "./poll-forms";

export const metadata: Metadata = { title: "Votación" };

export default async function PollPage({ params }: PageProps<"/polls/[id]">) {
  const member = await requireMember();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: poll }, players, games] = await Promise.all([
    supabase
      .from("polls")
      .select(
        "id, session_id, closes_at, closed_at, created_by, sessions(date, name, place, plays(created_at, games(id, name)), session_attendees(player_id, players(display_name, avatar_url))), " +
          "candidates(id, game_id, added_by, chosen, approvals(player_id))",
      )
      .eq("id", id)
      .maybeSingle(),
    listPlayers(),
    listCatalogGames(),
  ]);
  if (!poll) notFound();

  type PollRow = {
    id: string;
    session_id: string;
    closes_at: string | null;
    closed_at: string | null;
    created_by: string | null;
    sessions: {
      date: string;
      name: string | null;
      place: string | null;
      plays: { created_at: string; games: { id: string; name: string } | null }[];
      session_attendees: { player_id: string; players: { display_name: string; avatar_url: string | null } | null }[];
    } | null;
    candidates: { id: string; game_id: string; added_by: string | null; chosen: boolean; approvals: { player_id: string }[] }[];
  };
  const p = poll as unknown as PollRow;

  const byId = new Map(players.map((pl) => [pl.id, { id: pl.id, name: pl.display_name, avatarUrl: pl.avatar_url }]));
  /** The faces of these Players, by name. */
  const faces = (ids: string[]) => ids.flatMap((id) => byId.get(id) ?? []).sort((a, b) => a.name.localeCompare(b.name, "es"));
  const gameNames = new Map(games.map((g) => [g.id, g.name]));
  const open = isPollOpen({ closesAt: p.closes_at, closedAt: p.closed_at });

  const ranked = rankCandidates(
    p.candidates.map((c) => ({
      id: c.id,
      gameId: c.game_id,
      name: gameNames.get(c.game_id) ?? "?",
      approvals: c.approvals.map((a) => a.player_id),
      chosen: c.chosen,
    })),
  );

  const proposed = new Set(p.candidates.map((c) => c.game_id));
  const available = games.filter((g) => !g.retired && !proposed.has(g.id));

  const listed = [...ranked].sort((a, b) => a.name.localeCompare(b.name, "es"));
  const url = `${appUrl()}/polls/${p.id}`;
  const sessionDate = p.sessions ? formatSessionDate(p.sessions.date) : "";

  return (
    <div className="space-y-6">
      {p.sessions && <SessionHeader session={sessionSummary(p.session_id, p.sessions)} />}
      <section className="space-y-1">
        <h1 className="text-4xl">¿A qué jugamos?</h1>
        <p className="text-sm text-muted">
          {open
            ? p.closes_at
              ? `Abierta hasta el ${formatDeadline(p.closes_at)}.`
              : "Abierta hasta que se cierre a mano."
            : "Votación cerrada."}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <WhatsAppButton text={`¿A qué jugamos el ${sessionDate}? Vota aquí: ${url}`} label="Compartir por WhatsApp" />
          {open && <ClosePollButton pollId={p.id} />}
        </div>
      </section>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {ranked.length > 0 && (
          <aside className="card space-y-2 lg:sticky lg:top-20 lg:order-last">
            <h2>Clasificación</h2>
            <ol className="space-y-1 text-sm">
              {ranked.map((c) => (
                <li key={c.id} className="flex items-baseline gap-2">
                  <span className="w-8 shrink-0 font-display text-muted">{c.position}.º</span>
                  <span className={`min-w-0 flex-1 truncate ${c.leading || c.chosen ? "font-bold text-accent" : ""}`}>
                    {c.chosen && <Icon d={CHECK} className="mr-1 inline size-4 -translate-y-px stroke-[3] text-accent" />}
                    {c.name}
                  </span>
                  <span className="shrink-0">{`${c.approvals.length} ${c.approvals.length === 1 ? "voto" : "votos"}`}</span>
                </li>
              ))}
            </ol>
          </aside>
        )}
        <div className="space-y-6">
          <section className="space-y-2">
            {ranked.length === 0 && <p className="text-muted">Aún no hay candidatos. ¡Añade alguno!</p>}
            {needsTieBreak(ranked) && !open && (
              <p className="alert">Hay empate en cabeza: marca los que vamos a jugar.</p>
            )}
            {/* Alphabetical, so voting does not move the card under your finger; the ranking is beside it. */}
            {listed.map((c) => {
              const mine = c.approvals.includes(member.playerId);
              const share = Math.round((c.approvals.length / Math.max(1, ...ranked.map((r) => r.approvals.length))) * 100);
              return (
                <div key={c.id} className={`card space-y-2 p-3 ${c.leading || c.chosen ? "border-accent" : ""}`}>
                  <div className="flex items-center gap-2">
                    <Link href={`/games/${c.gameId}`} className="flex-1 font-semibold">
                      {c.chosen && <Icon d={CHECK} className="mr-1 inline size-4 -translate-y-px stroke-[3] text-accent" />}
                      {c.name}
                    </Link>
                    <span className="text-sm font-medium">
                      <span className="font-display text-xl">{c.approvals.length}</span> {c.approvals.length === 1 ? "voto" : "votos"}
                    </span>
                  </div>
                  <div aria-hidden className="h-3.5 overflow-hidden rounded-full border-2 border-ink bg-background">
                    <div className={`h-full ${c.leading || c.chosen ? "bg-accent" : "bg-teal"}`} style={{ width: `${share}%` }} />
                  </div>
                  <Faces people={faces(c.approvals)} prefix="Le apetece a" />
                  <CandidateActions
                    pollId={p.id}
                    candidateId={c.id}
                    approve={open ? mine : undefined}
                    choose={!open ? c.chosen : undefined}
                    withdraw={open}
                  />
                </div>
              );
            })}
          </section>

          {open && (
            <section className="card space-y-3">
              <h2>Añadir un juego</h2>
              <ProposeForm pollId={p.id} games={available.map((g) => ({ id: g.id, name: g.name }))} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
