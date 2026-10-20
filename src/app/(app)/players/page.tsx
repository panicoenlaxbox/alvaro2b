import type { Metadata } from "next";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { AddGuestForm, PlayerEditor } from "./player-forms";

export const metadata: Metadata = { title: "Jugadores" };

export default async function PlayersPage() {
  const member = await requireMember();
  const supabase = await createClient();
  const { data: players } = await supabase
    .from("players")
    .select("id, display_name, avatar_url, user_id, created_by")
    .order("display_name");

  const members = (players ?? []).filter((p) => p.user_id);
  const guests = (players ?? []).filter((p) => !p.user_id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl">Jugadores</h1>

      <section className="space-y-3">
        <h2 className="text-lg">Miembros</h2>
        <ul className="card divide-y divide-border p-0">
          {members.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={p.display_name} url={p.avatar_url} />
              <PlayerEditor id={p.id} name={p.display_name} />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg">Invitados</h2>
        <p className="text-sm text-muted">
          Personas sin cuenta que juegan con el grupo. Un invitado puede convertirse en miembro conservando su historial: pídeselo al Admin.
        </p>
        <AddGuestForm />
        {guests.length > 0 && (
          <ul className="card divide-y divide-border p-0">
            {guests.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={p.display_name} />
                <PlayerEditor id={p.id} name={p.display_name} canDelete={member.isAdmin || p.created_by === member.userId} />
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}
