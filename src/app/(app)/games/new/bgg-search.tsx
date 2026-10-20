"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { BggSearchResult } from "@/lib/bgg/parse";
import { PoweredByBgg } from "@/components/powered-by-bgg";
import { searchBgg } from "../bgg-actions";

export function BggSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BggSearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2>Buscar en BoardGameGeek</h2>
        <PoweredByBgg />
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await searchBgg(query);
            setResults(result.results ?? null);
            setError(result.error ?? null);
          });
        }}
      >
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nombre del juego" aria-label="Buscar en BoardGameGeek" className="input" />
        <button type="submit" disabled={pending || query.trim().length < 2} className="btn-secondary">
          {pending ? "Buscando…" : "Buscar"}
        </button>
      </form>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      {results && results.length === 0 && <p className="text-sm text-muted">Sin resultados.</p>}
      {results && results.length > 0 && (
        <ul className="divide-y divide-border">
          {results.map((r) => (
            <li key={r.id}>
              <Link href={`/games/new?bgg=${r.id}`} className="flex justify-between gap-2 py-2">
                <span>{r.name}</span>
                {r.year && <span className="text-sm text-muted">{r.year}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted">Se importan solo jugadores, duración, complejidad, año y carátula. Todo se puede editar.</p>
    </section>
  );
}
