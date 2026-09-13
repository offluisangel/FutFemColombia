import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TeamsTable } from "./teams-table";

export const dynamic = "force-dynamic";

export default async function AdminTeams() {
  const supabase = await createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("name");

  return (
    <div>
      <AdminPageHeader
        title="Equipos"
        description="Gestiona equipos, nombre público, slug y ciudad."
      />
      <TeamsTable teams={teams ?? []} />
    </div>
  );
}
