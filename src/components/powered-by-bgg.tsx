/** Attribution that BoardGameGeek requires wherever its data is shown (ADR 0002). */
export function PoweredByBgg() {
  return (
    <a
      href="https://boardgamegeek.com"
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md bg-[#3f3a60] px-2 py-1 text-xs font-bold text-white"
    >
      Powered by <span className="text-[#ff5100]">BGG</span>
    </a>
  );
}
