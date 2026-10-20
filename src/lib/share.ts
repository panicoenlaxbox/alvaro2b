/** Link that opens WhatsApp with a prefilled message (wa.me works on mobile and desktop). */
export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Public base URL of the app: the production domain on Vercel, localhost otherwise. */
export function appUrl(): string {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return host ? `https://${host}` : "http://localhost:3000";
}
