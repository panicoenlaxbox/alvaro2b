"use client";

/** Checkbox chips to pick Players; Members first, then Guests. Deactivated Members only show if already picked. */
export function PlayerPicker({
  name,
  players,
  selected = [],
}: {
  name: string;
  players: { id: string; display_name: string; is_member: boolean; active?: boolean }[];
  selected?: string[];
}) {
  const sorted = players.filter((p) => p.active !== false || selected.includes(p.id)).sort((a, b) => Number(b.is_member) - Number(a.is_member) || a.display_name.localeCompare(b.display_name, "es"));
  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map((p) => (
        <label key={p.id} className="cursor-pointer">
          <input type="checkbox" name={name} value={p.id} defaultChecked={selected.includes(p.id)} className="peer sr-only" />
          <span className="chip px-3 py-1.5 text-sm peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
            {p.display_name}
            {!p.is_member && <span className="ml-1 opacity-70">(inv.)</span>}
          </span>
        </label>
      ))}
    </div>
  );
}
