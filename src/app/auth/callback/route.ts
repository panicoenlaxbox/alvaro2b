import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  // Supabase Auth reports the allowlist trigger rejection as a database error.
  const providerError = searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    const reason = /database error/i.test(providerError) ? "not_allowed" : "auth";
    return NextResponse.redirect(`${origin}/login?error=${reason}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNextPath(searchParams.get("next"))}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
