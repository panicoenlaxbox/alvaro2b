import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { PhotoZipDownloader } from "./photo-zip";

export const metadata: Metadata = { title: "Exportar datos" };

export default async function ExportPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Exportar datos</h1>

      <section className="card space-y-2">
        <h2 className="font-semibold">Datos en JSON</h2>
        <p className="text-sm text-muted">
          Todas las tablas: jugadores, emails autorizados, catálogo, sesiones, partidas, votaciones y fichas de las fotos.
        </p>
        <a href="/api/export" className="btn-primary" download>
          Descargar JSON
        </a>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Fotos</h2>
        <p className="text-sm text-muted">
          Se descargan en ZIP por partes, ordenadas por sesión. El navegador prepara cada parte, así que puede tardar un poco.
        </p>
        <PhotoZipDownloader />
      </section>

      <p className="text-xs text-muted">
        Además, cada semana se guarda una copia cifrada de la base de datos en GitHub Actions. Esa copia no incluye las fotos.
      </p>
    </div>
  );
}
