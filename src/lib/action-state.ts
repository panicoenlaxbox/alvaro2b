import type { PostgrestError } from "@supabase/supabase-js";

export type ActionState = { error?: string; ok?: boolean; message?: string };

export const initialActionState: ActionState = {};

/** Spanish message for the database errors a Member can actually cause. */
export function errorMessage(error: Pick<PostgrestError, "code" | "message"> | null | undefined): string {
  if (!error) return "Algo ha fallado. Vuelve a intentarlo.";
  switch (error.code) {
    case "23505":
      return "Ya existe.";
    case "23503":
      return "No se puede borrar porque tiene historial asociado.";
    case "23514":
      return checkMessage(error.message);
    case "42501":
      return "No tienes permiso para hacer esto.";
    case "PGRST116":
      return "No encontrado o sin permiso.";
    default:
      return "Algo ha fallado. Vuelve a intentarlo.";
  }
}

// Messages raised by our own triggers (English in the database, Spanish for the Member).
const CHECK_MESSAGES: Record<string, string> = {
  "The group needs at least one Admin": "El grupo necesita al menos un Admin.",
  "That Player is already a Member": "Ese jugador ya es miembro.",
};

function checkMessage(message: string): string {
  return CHECK_MESSAGES[message] ?? "Algún dato no es válido.";
}
