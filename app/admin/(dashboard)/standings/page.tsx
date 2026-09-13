import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StandingsTable as StandingsCRUD } from "./standings-crud";

export const dynamic = "force-dynamic";

export default async function AdminStandings() {
  const supabase = await createClient();

  const [standingsRes, teamsRes] = await Promise.all([
    supabase.from("standings").select("*").order("pos"),
    supabase.from("teams").select("id, name"),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Posiciones"
        description="Vista deportiva en solo lectura. Se actualiza desde scrapers."
      />
      <StandingsCRUD
        standings={standingsRes.data ?? []}
        teams={teamsRes.data ?? []}
      />
    </div>
  );
}
