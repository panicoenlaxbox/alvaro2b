import { PLAY_MODE_LABELS, PLAY_MODES } from "@/lib/domain/game-form";

/** Chip look for the radio and checkbox filters, on a `peer sr-only` input. */
export const CHIP = "toggle peer-checked:border-accent peer-checked:bg-accent peer-checked:text-ink peer-focus-visible:outline-3 peer-focus-visible:outline-accent";

export const PLAYER_CHOICES = [{ value: "", label: "Todos" }, ...[2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) }))];
export const MINUTE_CHOICES = [
  { value: "", label: "Me da igual" },
  { value: "60", label: "1 h" },
  { value: "120", label: "2 h" },
  { value: "240", label: "4 h" },
];
export const MODE_CHOICES = [{ value: "", label: "Me da igual" }, ...PLAY_MODES.map((m) => ({ value: m, label: PLAY_MODE_LABELS[m] }))];

/** Radio chips over one GET parameter. A value set some other way (a Session's Attendees) gets its own chip. */
export function ChoiceGroup({ legend, name, current, options }: { legend: string; name: string; current: string; options: { value: string; label: string }[] }) {
  const shown = options.some((o) => o.value === current) ? options : [...options, { value: current, label: name === "minutes" ? `${current} min` : current }];
  return (
    <fieldset className="min-w-0 space-y-2 max-sm:w-full">
      <legend className="label">{legend}</legend>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pt-0.5 pb-1.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {shown.map((o) => (
          <label key={o.value} className="relative shrink-0">
            <input type="radio" name={name} value={o.value} defaultChecked={o.value === current} className="peer sr-only" />
            <span className={`${CHIP} ${/^\d+$/.test(o.label) ? "min-w-12 font-display text-lg" : ""}`}>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
