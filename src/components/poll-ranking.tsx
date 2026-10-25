import Link from "next/link";
import type { RankedCandidate } from "@/lib/domain/poll";
import { CHECK, Icon } from "./icon";

/** A Poll's ranking: position, Game and votes, the leaders and the chosen ones in the accent colour. */
export function PollRanking({ ranked }: { ranked: RankedCandidate[] }) {
  return (
    <ol className="space-y-1 text-sm">
      {ranked.map((c) => (
        <li key={c.id} className="flex items-baseline gap-2">
          <span className="w-8 shrink-0 font-display text-muted">{c.position}.º</span>
          {/* The link truncates itself: a truncating wrapper would clip its highlighter stroke at the word's edges. */}
          <span className={`flex min-w-0 flex-1 items-baseline ${c.leading || c.chosen ? "font-bold text-accent" : ""}`}>
            {c.chosen && <Icon d={CHECK} className="mr-1 inline size-4 shrink-0 -translate-y-px self-center stroke-[3] text-accent" />}
            <Link href={`/games/${c.gameId}`} className="link relative min-w-0 truncate">
              {c.name}
            </Link>
          </span>
          <span className="shrink-0">{`${c.approvals.length} ${c.approvals.length === 1 ? "voto" : "votos"}`}</span>
        </li>
      ))}
    </ol>
  );
}
