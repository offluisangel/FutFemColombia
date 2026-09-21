import { createClient } from "@/lib/supabase/server";

// Nombre de la temporada activa (tabla seasons). Devuelve null si no hay
// temporada activa o si la consulta falla — los helpers de lib/season.ts
// cubren ese caso con el año corriente.
export async function getActiveSeasonName(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("seasons")
      .select("name")
      .eq("is_active", true)
      .maybeSingle();
    return data?.name ?? null;
  } catch {
    return null;
  }
}