"use client";

import { PlayerFace } from "@/components/player-face";

/** Checkbox faces to pick Players; Members first, then Guests. Deactivated Members only show if already picked. */
export function PlayerPicker({
  name,
  players,
  selected = [],
}: {
  name: string;
  players: { id: string; display_name: string; is_member: boolean; avatar_url?: string | null; active?: boolean }[];
  selected?: string[];
}) {
  const sorted = players
    .filter((p) => p.active !== false || selected.includes(p.id))
    .sort((a, b) => Number(b.is_member) - Number(a.is_member) || a.display_name.localeCompare(b.display_name, "es"));
  return (
    <div className="flex flex-wrap gap-4">
      {sorted.map((p) => (
        <label key={p.id} className="flex cursor-pointer flex-col items-center">
          <input type="checkbox" name={name} value={p.id} defaultChecked={selected.includes(p.id)} className="peer sr-only" />
          <PlayerFace
            name={p.display_name}
            avatarUrl={p.avatar_url ?? null}
            isMember={p.is_member}
            faceClassName="opacity-50 ring-transparent grayscale peer-checked:opacity-100 peer-checked:ring-accent peer-checked:grayscale-0 peer-focus-visible:ring-foreground"
            nameClassName="text-muted peer-checked:font-semibold peer-checked:text-accent"
          />
        </label>
      ))}
    </div>
  );
}
