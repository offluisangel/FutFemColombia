import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { apiError, getErrorMessage } from "@/lib/admin/api"
import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminUser } from "@/lib/admin/auth"
import { applyScraperData, isScraperId } from "@/lib/admin/scrapers"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAdminUser()
  if (response) return response

  const { id } = await params
  const supabase = createAdminClient()
  const { data: run, error } = await supabase
    .from("scraper_runs")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !run) return apiError("Ejecución no encontrada", 404, "NOT_FOUND")
  if (run.status !== "pending_review") return apiError("Solo se pueden aplicar ejecuciones pendientes", 409, "INVALID_STATUS")
  if (!isScraperId(run.scraper)) return apiError("Scraper inválido", 400, "UNKNOWN_SCRAPER")

  try {
    await applyScraperData(run.scraper, run.raw_data, supabase)

    const { data: updated, error: updateError } = await supabase
      .from("scraper_runs")
      .update({ status: "applied", applied_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (updateError) return apiError(updateError.message)

    await logAdminAction({
      supabase,
      userId: user.id,
      action: "scraper.applied",
      entityType: "scraper_run",
      entityId: id,
      before: run,
      after: updated,
      metadata: { scraper: run.scraper, summary: run.summary },
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    const message = getErrorMessage(err)
    await supabase.from("scraper_runs").update({ status: "failed", error_message: message }).eq("id", id)
    return apiError(message)
  }
}
