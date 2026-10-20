import { notFound, redirect } from "next/navigation";
import { isLocalDevelopment } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// Development-only sign-in as the fictional Members of supabase/seed/01_members.sql. It does not exist in
// production builds, and it also refuses to run against a remote Supabase project.
const SEED_MEMBERS = [
  { email: "ana@example.com", name: "Ana (Admin)" },
  { email: "bruno@example.com", name: "Bruno" },
  { email: "carla@example.com", name: "Carla" },
];

async function signIn(formData: FormData) {
  "use server";
  if (!isLocalDevelopment()) notFound();
  const email = String(formData.get("email"));
  if (!SEED_MEMBERS.some((m) => m.email === email)) notFound();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: "password123" });
  if (error) throw new Error(`Dev sign-in failed: ${error.message}`);
  redirect("/");
}

export default function DevLoginPage() {
  if (!isLocalDevelopment()) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
      <h1 className="text-3xl sm:text-4xl">Entrar como Member ficticio</h1>
      <p className="text-sm text-muted">Solo disponible en local, con los datos de ejemplo.</p>
      {SEED_MEMBERS.map((m) => (
        <form key={m.email} action={signIn}>
          <input type="hidden" name="email" value={m.email} />
          <button type="submit" className="btn-secondary w-full">
            {m.name}
          </button>
        </form>
      ))}
    </main>
  );
}
