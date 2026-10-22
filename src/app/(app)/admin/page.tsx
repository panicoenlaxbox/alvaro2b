import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { appUrl } from "@/lib/share";
import { createClient } from "@/lib/supabase/server";
import { AddEmailForm, AddGuestForm, AllowedEmailRow, GuestRow } from "./admin-forms";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  // Seeded emails share created_at: the email breaks the tie, so a row never jumps after an edit.
  const [{ data: emails }, { data: guests }, { data: lastSeen }] = await Promise.all([
    supabase.from("allowed_emails").select("email, is_admin, player_id, players(display_name, avatar_url, user_id, deactivated_at)").order("created_at").order("email"),
    supabase.from("players").select("id, display_name, deactivated_at").is("user_id", null).order("display_name"),
    supabase.rpc("member_last_seen"),
  ]);
  const lastSeenByPlayer = new Map((lastSeen ?? []).map((l) => [l.player_id, l.last_seen_at]));

  // A Guest with a pending invitation shows once, as that invitation.
  const linkedGuestIds = new Set((emails ?? []).map((e) => e.player_id));
  const freeGuests = (guests ?? []).filter((g) => !linkedGuestIds.has(g.id));
  const url = appUrl();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl">Admin</h1>

      <section className="card space-y-3">
        <h2>Nuevo miembro</h2>
        <AddEmailForm guests={freeGuests.filter((g) => !g.deactivated_at)} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg">Miembros</h2>
        <ul className="card divide-y divide-border p-0">
          {(emails ?? []).map((e) => (
            <AllowedEmailRow
              key={e.email}
              email={e.email}
              isAdmin={e.is_admin}
              playerId={e.player_id}
              playerName={e.players?.display_name ?? null}
              avatarUrl={e.players?.avatar_url ?? null}
              signedUp={Boolean(e.players?.user_id)}
              deactivated={Boolean(e.players?.deactivated_at)}
              lastSeen={(e.player_id && lastSeenByPlayer.get(e.player_id)) || null}
              isSelf={e.email === admin.email}
              appUrl={url}
            />
          ))}
        </ul>
      </section>

      <section className="card space-y-3">
        <h2>Nuevo invitado</h2>
        <AddGuestForm />
      </section>

      {freeGuests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg">Invitados</h2>
          <ul className="card divide-y divide-border p-0">
            {freeGuests.map((g) => (
              <GuestRow key={g.id} id={g.id} name={g.display_name} deactivated={Boolean(g.deactivated_at)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
