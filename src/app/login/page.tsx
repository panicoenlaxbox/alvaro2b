import type { Metadata } from "next";
import Link from "next/link";
import { LogoDie } from "@/components/logo";
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
      <div className="flex flex-col items-center gap-4 text-center">
        <LogoDie className="size-24 -rotate-6" />
        <h1 className="text-5xl">alvaro2b</h1>
        <p className="font-display text-lg text-soft">¿A qué jugamos hoy?</p>
        <p className="text-soft">Las quedadas de juegos de mesa del grupo: sesiones, votaciones, partidas y fotos.</p>
      </div>

      {message && (
        <p role="alert" className="alert">
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
