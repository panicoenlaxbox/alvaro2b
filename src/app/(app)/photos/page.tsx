import type { Metadata } from "next";

export const metadata: Metadata = { title: "Fotos" };

export default function Page() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">Fotos</h1>
      <p className="text-muted">Próximamente.</p>
    </div>
  );
}
