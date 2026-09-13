import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/admin/api";
import { logAdminAction } from "@/lib/admin/audit";
import { requireAdminUser } from "@/lib/admin/auth";
import { stageStandingsSchema, validationError } from "@/lib/validations/admin";

export async function PUT(req: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (response) return response;
  const parsed = stageStandingsSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
  const supabase = createAdminClient();
  const { data: before } = await supabase.from("stage_standings").select("*").eq("season_id", parsed.data.season_id).eq("stage", parsed.data.stage).eq("group_name", parsed.data.group_name);
  const rows = parsed.data.rows.map((row) => ({ ...row, season_id: parsed.data.season_id, stage: parsed.data.stage, group_name: parsed.data.group_name, dif: row.gf - row.gc, updated_at: new Date().toISOString() }));
  const positions = rows.map((row) => row.pos);
  const teams = rows.map((row) => row.team_id);
  const expectedPositions = Array.from({ length: rows.length }, (_, index) => index + 1);
  if (new Set(positions).size !== positions.length || new Set(teams).size !== teams.length || positions.sort((a, b) => a - b).some((position, index) => position !== expectedPositions[index])) {
    return apiError("Las posiciones y equipos deben ser únicos y consecutivos", 400, "INVALID_STANDINGS");
  }
  if (rows.some((row) => row.pj !== row.pg + row.pe + row.pp)) {
    return apiError("PJ debe coincidir con G + E + P", 400, "INVALID_STANDINGS");
  }
  const incomingTeamIds = new Set(rows.map((row) => row.team_id));
  const staleIds = (before ?? []).filter((row) => !incomingTeamIds.has(row.team_id)).map((row) => row.id);
  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase.from("stage_standings").delete().in("id", staleIds);
    if (deleteError) return apiError(deleteError.message);
  }
  const { data, error } = await supabase.from("stage_standings").upsert(rows, { onConflict: "season_id,stage,group_name,team_id" }).select();
  if (error) return apiError(error.message);
  await logAdminAction({ supabase, userId: user.id, action: "stage_standings.updated", entityType: "stage_standings", before: before ?? [], after: data ?? [], metadata: { season_id: parsed.data.season_id, stage: parsed.data.stage, group_name: parsed.data.group_name, count: rows.length } });
  return NextResponse.json(data ?? []);
}
