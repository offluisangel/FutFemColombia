import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";
import { apiError } from "@/lib/admin/api";
import { requireAdminUser } from "@/lib/admin/auth";
import { seasonSchema, validationError } from "@/lib/validations/admin";

export async function POST(req: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (response) return response;

  const parsed = seasonSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(validationError(parsed.error), { status: 400 });

  const supabase = createAdminClient();
  if (parsed.data.is_active) {
    await supabase
      .from("seasons")
      .update({ is_active: false })
      .eq("is_active", true);
  }

  const { data, error } = await supabase
    .from("seasons")
    .insert(parsed.data)
    .select()
    .single();
  if (error) return apiError(error.message);

  await logAdminAction({
    supabase,
    userId: user.id,
    action: "season.created",
    entityType: "season",
    entityId: data.id,
    after: data,
  });

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (response) return response;

  const supabase = createAdminClient();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return apiError("id required", 400, "BAD_REQUEST");

  const parsed = seasonSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(validationError(parsed.error), { status: 400 });

  const { data: before } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (parsed.data.is_active) {
    await supabase.from("seasons").update({ is_active: false }).neq("id", id);
  }

  const { data, error } = await supabase
    .from("seasons")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();
  if (error) return apiError(error.message);

  await logAdminAction({
    supabase,
    userId: user.id,
    action: parsed.data.is_active ? "season.activated" : "season.updated",
    entityType: "season",
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

  const { count } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("season_id", id);
  if ((count ?? 0) > 0) {
    return apiError(
      "No se puede eliminar una temporada con partidos asociados",
      409,
      "DEPENDENCY_EXISTS",
      { matches: count },
    );
  }

  const { data: before } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("seasons").delete().eq("id", id);
  if (error) return apiError(error.message);

  await logAdminAction({
    supabase,
    userId: user.id,
    action: "season.deleted",
    entityType: "season",
    entityId: id,
    before,
  });

  return NextResponse.json({ success: true });
}
