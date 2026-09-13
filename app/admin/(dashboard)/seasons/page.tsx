import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeasonsTable } from "./seasons-table";

export const dynamic = "force-dynamic";

export default async function AdminSeasons() {
  const supabase = await createClient();
  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .order("name");

  return (
    <div>
      <AdminPageHeader
        title="Temporadas"
        description="Crea y administra temporadas. Debe existir solo una activa."
      />
      <SeasonsTable seasons={seasons ?? []} />
    </div>
  );
}
