import type { Metadata } from "next";

export const metadata: Metadata = { title: "Estadísticas" };

export default function Page() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">Estadísticas</h1>
      <p className="text-muted">Próximamente.</p>
    </div>
  );
}
