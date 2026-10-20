import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { todayIso } from "@/lib/domain/session";
import { createClient } from "@/lib/supabase/server";
import { updateSession } from "../../actions";
import { SessionForm } from "../../session-form";

export const metadata: Metadata = { title: "Editar sesión" };

export default async function EditSessionPage({ params }: PageProps<"/sessions/[id]/edit">) {
  await requireMember();
  const { id } = await params;
  const supabase = await createClient();
  const { data: session } = await supabase.from("sessions").select("id, date, name, place, notes").eq("id", id).maybeSingle();
  if (!session) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl sm:text-4xl">Editar sesión</h1>
      <SessionForm action={updateSession} defaults={session} submitLabel="Guardar cambios" today={todayIso()} />
    </div>
  );
}
