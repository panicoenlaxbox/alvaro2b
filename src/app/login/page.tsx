import type { Metadata } from "next";
import Link from "next/link";
import { safeNextPath } from "@/lib/paths";
import { isLocalDevelopment } from "@/lib/supabase/env";
import { GoogleSignInButton } from "./google-sign-in-button";

export const metadata: Metadata = { title: "Entrar" };

const ERRORS: Record<string, string> = {
  not_allowed: "Esta cuenta de Google no está en la lista de autorizados. Pide al Admin que añada tu email.",
  auth: "No se ha podido iniciar sesión. Vuelve a intentarlo.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, next } = await searchParams;
  const message = typeof error === "string" ? (ERRORS[error] ?? ERRORS.auth) : null;
  const nextPath = safeNextPath(typeof next === "string" ? next : null);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">alvaro2b</h1>
        <p className="text-muted">Las quedadas de juegos de mesa del grupo.</p>
      </div>

      {message && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {message}
        </p>
      )}

      <GoogleSignInButton next={nextPath} />

      {isLocalDevelopment() && (
        <Link href="/dev-login" className="text-center text-sm text-muted underline">
          Entrar como Member ficticio (solo en local)
        </Link>
      )}

      <p className="text-center text-xs text-muted">
        Solo para Members invitados. <Link href="/privacy" className="underline">Privacidad</Link>
      </p>
    </main>
  );
}
