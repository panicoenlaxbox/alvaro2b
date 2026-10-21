import { getBggThing } from "@/lib/bgg/client";
import { bggPageUrl } from "@/lib/domain/game-form";
import { PoweredByBgg } from "./powered-by-bgg";

/**
 * "BGG info" (PRD 2): read from BoardGameGeek on the server, cached about a week and shown as is.
 * It is never stored as group data.
 */
export async function BggInfo({ bggId }: { bggId: number }) {
  const thing = await getBggThing(bggId);

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2>Datos de BoardGameGeek</h2>
        <PoweredByBgg href={bggPageUrl(bggId)} label="Ver en BoardGameGeek" />
      </div>
      {!thing ? (
        <p className="text-sm text-muted">BoardGameGeek no responde ahora mismo.</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {thing.averageRating !== null && (
              <div>
                <dt className="text-muted">Valoración en BGG</dt>
                <dd className="font-semibold">{thing.averageRating.toLocaleString("es-ES", { maximumFractionDigits: 1 })} / 10</dd>
              </div>
            )}
            {thing.bestPlayers.length > 0 && (
              <div>
                <dt className="text-muted">Mejor con</dt>
                <dd className="font-semibold">{thing.bestPlayers.join(", ")} jugadores</dd>
              </div>
            )}
          </dl>
          {thing.mechanics.length > 0 && (
            <ul className="flex flex-wrap gap-1">
              {thing.mechanics.map((m) => (
                <li key={m} className="chip">
                  {m}
                </li>
              ))}
            </ul>
          )}
          {thing.description && (
            <details>
              <summary className="cursor-pointer text-sm font-medium">Descripción (en inglés)</summary>
              <p className="mt-2 whitespace-pre-line text-sm">{thing.description}</p>
            </details>
          )}
        </>
      )}
    </section>
  );
}
