import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StageStandingsCrud } from "./stage-standings-crud";
import { MatchesTable } from "../matches/matches-table";

export const dynamic = "force-dynamic";

export default async function AdminQuadrangulares() {
  const supabase = await createClient();
  const [rows, matches, seasons, teams] = await Promise.all([
    supabase.from("stage_standings").select("*").order("season_id").order("stage").order("group_name").order("pos"),
    supabase.from("matches").select("*").in("phase", ["cuadrangular", "semifinal", "final"]).order("match_date", { ascending: true }),
    supabase.from("seasons").select("*").order("name", { ascending: false }),
    supabase.from("teams").select("*").order("name"),
  ]);
  return <div className="space-y-6"><AdminPageHeader title="Cuadrangulares" description="Gestiona grupos, programación, marcadores y llaves de la fase final." /><StageStandingsCrud rows={rows.data ?? []} seasons={seasons.data ?? []} teams={teams.data ?? []} /><MatchesTable matches={matches.data ?? []} seasons={seasons.data ?? []} teams={teams.data ?? []} initialPhase="cuadrangular" /></div>;
}
