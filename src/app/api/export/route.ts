import { getCurrentMember } from "@/lib/auth";
import { exportAll } from "@/lib/data/export";
import { todayIso } from "@/lib/domain/session";

// Admin-only JSON export of every table (PRD 9). Photos are downloaded separately.
export async function GET() {
  const member = await getCurrentMember();
  if (!member?.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = JSON.stringify(await exportAll(), null, 2);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="alvaro2b-${todayIso()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
