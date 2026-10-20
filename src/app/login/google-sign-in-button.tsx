"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton({ next }: { next: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    const supabase = createClient();
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", next);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });
    if (error) {
      setPending(false);
      router.replace("/login?error=auth");
    }
  }

  return (
    <button type="button" onClick={signIn} disabled={pending} className="btn-primary min-h-14 w-full text-lg shadow-hard-lg">
      <svg aria-hidden viewBox="0 0 24 24" className="size-5">
        <path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.5 2.45-2.58 3.92-5.35 3.92a6 6 0 1 1 3.9-10.55l2.2-2.2A9.1 9.1 0 1 0 12 21.1c4.8 0 8.85-3.35 9.5-8.2.06-.6-.05-1.2-.15-1.8Z" />
      </svg>
      {pending ? "Abriendo Google…" : "Entrar con Google"}
    </button>
  );
}
