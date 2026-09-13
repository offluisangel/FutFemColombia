import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MatchesTable } from "./matches-table";

export const dynamic = "force-dynamic";

export default async function AdminMatches() {
  const supabase = await createClient();

  const [matchesRes, teamsRes, seasonsRes] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: false }),
    supabase.from("teams").select("*").order("name"),
    supabase.from("seasons").select("*").order("name"),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Partidos"
        description="Gestiona calendario, estado y marcadores de cada jornada."
      />
      <MatchesTable
        matches={matchesRes.data ?? []}
        teams={teamsRes.data ?? []}
        seasons={seasonsRes.data ?? []}
      />
    </div>
  );
}
