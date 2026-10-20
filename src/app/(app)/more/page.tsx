import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { Avatar } from "@/components/avatar";

export const metadata: Metadata = { title: "Más" };

export default async function MorePage() {
  const member = await requireMember();

  return (
    <div className="space-y-6">
      <section className="card flex items-center gap-3">
        <Avatar name={member.displayName} url={member.avatarUrl} size={48} />
        <div className="min-w-0">
          <p className="font-semibold">{member.displayName}</p>
          <p className="truncate text-sm text-muted">{member.email}</p>
          {member.isAdmin && <span className="chip mt-1 border-accent text-accent">Admin</span>}
        </div>
      </section>

      <nav className="card divide-y divide-border p-0">
        <Link href="/privacy" className="block px-4 py-3">
          Privacidad
        </Link>
      </nav>

      <form action="/auth/signout" method="post">
        <button type="submit" className="btn-secondary w-full">
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
