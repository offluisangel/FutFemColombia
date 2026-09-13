import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { apiError } from "@/lib/admin/api"
import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminUser } from "@/lib/admin/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAdminUser()
  if (response) return response

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const reason = typeof body.reason === "string" ? body.reason : null
  const supabase = createAdminClient()

  const { data: run, error } = await supabase
    .from("scraper_runs")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !run) return apiError("Ejecución no encontrada", 404, "NOT_FOUND")
  if (run.status !== "pending_review") return apiError("Solo se pueden rechazar ejecuciones pendientes", 409, "INVALID_STATUS")

  const { data: updated, error: updateError } = await supabase
    .from("scraper_runs")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", id)
    .select()
    .single()

  if (updateError) return apiError(updateError.message)

  await logAdminAction({
    supabase,
    userId: user.id,
    action: "scraper.rejected",
    entityType: "scraper_run",
    entityId: id,
    before: run,
    after: updated,
    metadata: { scraper: run.scraper, reason },
  })

  return NextResponse.json(updated)
}
