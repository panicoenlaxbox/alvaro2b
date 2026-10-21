/** Notes that read like the flavour text of a card: serif italics, set apart by a thin rule. */
export function FlavorText({ children }: { children: string }) {
  return <p className="max-w-prose border-l-2 border-muted/50 pl-4 font-serif text-lg whitespace-pre-line text-muted italic">{children}</p>;
}
