import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";
import { apiError } from "@/lib/admin/api";
import { requireAdminUser } from "@/lib/admin/auth";

export async function PUT(req: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (response) return response;

  const supabase = createAdminClient();
  const { standings } = await req.json();
  if (!Array.isArray(standings))
    return apiError("standings must be an array", 400, "BAD_REQUEST");

  const ids = standings.map((row) => row.id).filter(Boolean);
  const { data: beforeRows } = await supabase
    .from("standings")
    .select("*")
    .in("id", ids);

  for (const row of standings) {
    const { error } = await supabase
      .from("standings")
      .update({
        pos: row.pos,
        pts: row.pts,
        pj: row.pj,
        pg: row.pg,
        pe: row.pe,
        pp: row.pp,
        gf: row.gf,
        gc: row.gc,
        dif: row.dif,
      })
      .eq("id", row.id);

    if (error) return apiError(error.message);
  }

  await logAdminAction({
    supabase,
    userId: user.id,
    action: "standings.updated",
    entityType: "standing",
    before: beforeRows ?? [],
    after: standings,
    metadata: { count: standings.length },
  });

  return NextResponse.json({ success: true });
}
