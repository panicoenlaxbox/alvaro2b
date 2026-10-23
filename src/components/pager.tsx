import Link from "next/link";

/** Newer/older links around "Página N de M"; nothing when everything fits in one page. */
export function Pager({
  page,
  pageCount,
  href,
  label,
  older,
  className = "",
}: {
  page: number;
  pageCount: number;
  href: (page: number) => string;
  label: string;
  /** "Más antiguas" or "Más antiguos", to agree with what is listed. */
  older: string;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label={label} className={`flex items-center justify-between gap-2 ${className}`.trim()}>
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn-secondary">
          ← Más recientes
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted">
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={href(page + 1)} className="btn-secondary">
          {older} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
