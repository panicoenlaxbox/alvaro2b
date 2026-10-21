import { todayIso } from "@/lib/domain/session";

/** A Session date as a tear-off calendar page: month on top, big day, weekday, and the year when it is not this one. */
export function DateTile({ date, size = "md" }: { date: string; size?: "md" | "lg" }) {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(Date.UTC(y!, m! - 1, d!));
  const part = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-ES", { ...options, timeZone: "UTC" }).format(day).replace(".", "");
  const lg = size === "lg";
  const otherYear = date.slice(0, 4) !== todayIso().slice(0, 4);

  return (
    <span aria-hidden className={`flex shrink-0 flex-col items-center overflow-hidden rounded-xl border-[3px] border-ink bg-paper text-ink ${lg ? "w-24" : "w-16"}`}>
      <span className={`w-full bg-coral text-center font-display uppercase ${lg ? "py-1 text-sm" : "py-0.5 text-[11px]"}`}>{part({ month: "short" })}</span>
      <span className={`font-display leading-tight ${lg ? "text-4xl" : "text-2xl"}`}>{d}</span>
      <span className={`font-bold first-letter:uppercase ${lg ? "pb-1.5 text-sm" : "pb-1 text-[11px]"}`}>{part({ weekday: lg ? "long" : "short" })}</span>
      {otherYear && <span className={`-mt-1 font-bold text-[#6b6480] ${lg ? "pb-1.5 text-sm" : "pb-1 text-[11px]"}`}>{y}</span>}
    </span>
  );
}
