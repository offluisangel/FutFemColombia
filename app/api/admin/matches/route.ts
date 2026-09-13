import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";
import { apiError } from "@/lib/admin/api";
import { requireAdminUser } from "@/lib/admin/auth";
import { bulkMatchSchema, matchSchema, validationError } from "@/lib/validations/admin";

export async function POST(req: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (response) return response;

  const parsed = matchSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(validationError(parsed.error), { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("matches")
    .insert(parsed.data)
    .select()
    .single();
  if (error) return apiError(error.message);

  await logAdminAction({
    supabase,
    userId: user.id,
    action: "match.created",
    entityType: "match",
    entityId: data.id,
    after: data,
  });

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (response) return response;

  const supabase = createAdminClient();
  const payload = await req.json();
  const bulk = bulkMatchSchema.safeParse(payload);
  if (bulk.success) {
    let targetQuery = supabase
      .from("matches")
      .select("id, local_score, away_score")
      .eq("season_id", bulk.data.season_id)
      .eq("jornada", bulk.data.jornada)
      .eq("phase", bulk.data.phase);
    if (bulk.data.group_name) {
      targetQuery = targetQuery.eq("group_name", bulk.data.group_name);
    } else {
      targetQuery = targetQuery.is("group_name", null);
    }

    const { data: targets, error: targetError } = await targetQuery;
    if (targetError) return apiError(targetError.message);
    if (!targets?.length) return apiError("No hay partidos en ese alcance", 404, "NOT_FOUND");
    if (bulk.data.status === "played" && targets.some((match) => match.local_score == null || match.away_score == null)) {
      return apiError("Completa todos los marcadores antes de marcar la jornada como jugada", 409, "INCOMPLETE_SCORES");
    }

    const update = bulk.data.clear_scores
      ? { status: bulk.data.status, local_score: null, away_score: null }
      : { status: bulk.data.status };
    let updateQuery = supabase
      .from("matches")
      .update(update)
      .eq("season_id", bulk.data.season_id)
      .eq("jornada", bulk.data.jornada)
      .eq("phase", bulk.data.phase);
    if (bulk.data.group_name) {
      updateQuery = updateQuery.eq("group_name", bulk.data.group_name);
    } else {
      updateQuery = updateQuery.is("group_name", null);
    }
    const { data, error } = await updateQuery.select("id");
    if (error) return apiError(error.message);
    await logAdminAction({
      supabase,
      userId: user.id,
      action: bulk.data.clear_scores ? "match.scores_cleared" : "match.round_updated",
      entityType: "match",
      metadata: {
              season_id: bulk.data.season_id,
              jornada: bulk.data.jornada,
              phase: bulk.data.phase,
              group_name: bulk.data.group_name,
              count: data?.length ?? 0,
            },
    });
    return NextResponse.json({ updated: data?.length ?? 0 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return apiError("id required", 400, "BAD_REQUEST");

  const parsed = matchSchema.safeParse(payload);
  if (!parsed.success)
    return NextResponse.json(validationError(parsed.error), { status: 400 });

  const { data: before } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const { data, error } = await supabase
    .from("matches")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();
  if (error) return apiError(error.message);

  await logAdminAction({
    supabase,
    userId: user.id,
    action: "match.updated",
    entityType: "match",
    entityId: id,
    before,
    after: data,
  });

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (response) return response;

  const supabase = createAdminClient();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return apiError("id required", 400, "BAD_REQUEST");

  const { data: before } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("matches").delete().eq("id", id);
  if (error) return apiError(error.message);

  await logAdminAction({
    supabase,
    userId: user.id,
    action: "match.deleted",
    entityType: "match",
    entityId: id,
    before,
  });

  return NextResponse.json({ success: true });
}
