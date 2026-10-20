import { requireMember } from "@/lib/auth";

export default async function HomePage() {
  const member = await requireMember();

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold">¡Hola, {member.displayName.split(" ")[0]}!</h1>
        <p className="text-muted">¿A qué jugamos hoy?</p>
      </section>
    </div>
  );
}
