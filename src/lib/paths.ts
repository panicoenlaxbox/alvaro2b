// Routes that signed-out visitors can open. Everything else requires a session.
const PUBLIC_PATHS = ["/login", "/privacy", "/auth", "/dev-login", "/api/keep-alive"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Only same-origin relative paths are valid redirect targets after sign-in. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}
