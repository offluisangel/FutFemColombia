import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";
import { apiError } from "@/lib/admin/api";
import { requireAdminUser } from "@/lib/admin/auth";
import { scorerSchema, validationError } from "@/lib/validations/admin";

export async function POST(req: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (response) return response;
  const parsed = scorerSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("scorers").insert(parsed.data).select().single();
  if (error) return apiError(error.message);
  await logAdminAction({ supabase, userId: user.id, action: "scorer.created", entityType: "scorer", entityId: data.id, after: data });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (response) return response;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return apiError("id required", 400, "BAD_REQUEST");
  const parsed = scorerSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });

  const supabase = createAdminClient();
  const { data: before } = await supabase.from("scorers").select("*").eq("id", id).maybeSingle();
  const { data, error } = await supabase.from("scorers").update(parsed.data).eq("id", id).select().single();
  if (error) return apiError(error.message);
  await logAdminAction({ supabase, userId: user.id, action: "scorer.updated", entityType: "scorer", entityId: id, before, after: data });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (response) return response;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return apiError("id required", 400, "BAD_REQUEST");

  const supabase = createAdminClient();
  const { data: before } = await supabase.from("scorers").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("scorers").delete().eq("id", id);
  if (error) return apiError(error.message);
  await logAdminAction({ supabase, userId: user.id, action: "scorer.deleted", entityType: "scorer", entityId: id, before });
  return NextResponse.json({ success: true });
}
