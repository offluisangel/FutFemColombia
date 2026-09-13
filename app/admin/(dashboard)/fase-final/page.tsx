import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FinalStageAdmin } from "./final-stage-admin";

export const dynamic = "force-dynamic";

export default async function AdminFinalStage() {
  const supabase = await createClient();
  const [matches, seasons, teams] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .in("phase", ["semifinal", "final"])
      .order("match_date", { ascending: true }),
    supabase.from("seasons").select("*").order("name", { ascending: false }),
    supabase.from("teams").select("*").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Fase final"
        description="Clasificados de los cuadrangulares, semifinales y final del campeonato."
      />
      <FinalStageAdmin
        matches={matches.data ?? []}
        seasons={seasons.data ?? []}
        teams={teams.data ?? []}
      />
    </div>
  );
}
