import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { appUrl } from "@/lib/share";
import { createClient } from "@/lib/supabase/server";
import { AddEmailForm, AllowedEmailRow } from "./admin-forms";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  // Seeded emails share created_at: the email breaks the tie, so a row never jumps after an edit.
  const [{ data: emails }, { data: guests }] = await Promise.all([
    supabase.from("allowed_emails").select("email, is_admin, player_id, players(display_name, user_id, deactivated_at)").order("created_at").order("email"),
    supabase.from("players").select("id, display_name").is("user_id", null).order("display_name"),
  ]);

  const linkedGuestIds = new Set((emails ?? []).map((e) => e.player_id));
  const url = appUrl();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl">Admin</h1>
        <p className="text-sm hint">
          Solo pueden entrar los emails de esta lista, con su cuenta de Google. La aplicación no envía emails: pasa tú el enlace.
        </p>
      </div>

      <section className="card space-y-3">
        <h2>Autorizar un email</h2>
        <AddEmailForm guests={(guests ?? []).filter((g) => !linkedGuestIds.has(g.id))} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg">Emails autorizados</h2>
        <ul className="card divide-y divide-border p-0">
          {(emails ?? []).map((e) => (
            <AllowedEmailRow
              key={e.email}
              email={e.email}
              isAdmin={e.is_admin}
              playerId={e.player_id}
              playerName={e.players?.display_name ?? null}
              signedUp={Boolean(e.players?.user_id)}
              deactivated={Boolean(e.players?.deactivated_at)}
              isSelf={e.email === admin.email}
              appUrl={url}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
