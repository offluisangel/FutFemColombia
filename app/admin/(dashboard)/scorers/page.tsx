import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ScorersTable } from "./scorers-table";

export const dynamic = "force-dynamic";

export default async function AdminScorers() {
  const supabase = await createClient();
  const [scorersRes, seasonsRes, teamsRes] = await Promise.all([
    supabase.from("scorers").select("*").order("pos").order("goals", { ascending: false }),
    supabase.from("seasons").select("id, name, is_active").order("name", { ascending: false }),
    supabase.from("teams").select("id, name").order("name"),
  ]);
  return (
    <div>
      <AdminPageHeader title="Goleadoras" description="Gestiona las estadísticas individuales por temporada." />
      <ScorersTable scorers={scorersRes.data ?? []} seasons={seasonsRes.data ?? []} teams={teamsRes.data ?? []} />
    </div>
  );
}
