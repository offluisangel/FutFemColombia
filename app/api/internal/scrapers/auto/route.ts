import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { logAdminAction } from "@/lib/admin/audit"
import {
  applyScraperData,
  BASE_SCRAPERS,
  buildScraperPreview,
  SCRAPER_CONFIGS,
  scrapeWithFallback,
  type ScraperId,
} from "@/lib/admin/scrapers"
import { shouldAutoApply } from "@/lib/admin/scraper-automation"

const CRON_SCRAPERS: ScraperId[] = ["stage-standings", "cuadrangular-matches"]

function readSecret(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const tokenFromBearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null
  const tokenFromHeader = request.headers.get("x-cron-secret")
  return tokenFromBearer ?? tokenFromHeader
}

async function tryScraper(
  scraper: ScraperId,
  supabase: ReturnType<typeof createAdminClient>,
  triggeredBy: string | null,
): Promise<{
  scraper: ScraperId
  runId?: string
  status: "applied" | "pending_review" | "failed"
  reason: string
  summary?: Record<string, unknown>
}> {
  const startedAt = new Date()

  try {
    const { data: rawData, source, warnings: fallbackWarnings } =
      await scrapeWithFallback(scraper)
    const preview = await buildScraperPreview(scraper, rawData, supabase)
    const decision = shouldAutoApply({
      scraper,
      summary: preview.summary,
      normalized: preview.normalized,
    })

    const warnings = decision.apply
      ? [...(preview.warnings ?? []), ...(fallbackWarnings ?? [])]
      : [
          ...(preview.warnings ?? []),
          ...(fallbackWarnings ?? []),
          `Auto-review: ${decision.reason}`,
        ]

    const summary = {
      ...preview.summary,
      warnings: warnings.length,
      source,
    }

    const finishedAt = new Date()

    const { data: run, error: insertError } = await supabase
      .from("scraper_runs")
      .insert({
        scraper,
        status: "pending_review",
        source_url: SCRAPER_CONFIGS[scraper].sourceUrl,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        duration_ms: finishedAt.getTime() - startedAt.getTime(),
        triggered_by: triggeredBy,
        summary,
        raw_data: rawData,
        normalized_data: preview.normalized,
        diff: preview.diff,
        warnings,
      })
      .select()
      .single()

    if (insertError || !run) {
      throw new Error(insertError?.message ?? "No se pudo crear scraper_run")
    }

    if (decision.apply) {
      await applyScraperData(scraper, rawData, supabase)
      const { data: updated } = await supabase
        .from("scraper_runs")
        .update({ status: "applied", applied_at: new Date().toISOString() })
        .eq("id", run.id)
        .select()
        .single()

      await logAdminAction({
        supabase,
        action: "scraper.auto_applied",
        entityType: "scraper_run",
        entityId: run.id,
        after: updated ?? run,
        metadata: { scraper, summary, reason: decision.reason },
      })

      return { scraper, runId: run.id, status: "applied", reason: decision.reason, summary }
    }

    await logAdminAction({
      supabase,
      action: "scraper.auto_previewed",
      entityType: "scraper_run",
      entityId: run.id,
      after: run,
      metadata: { scraper, summary, reason: decision.reason },
    })

    return { scraper, runId: run.id, status: "pending_review", reason: decision.reason, summary }
  } catch (error: unknown) {
    const finishedAt = new Date()
    const message = error instanceof Error ? error.message : "Unknown error"

    const { data: failedRun } = await supabase
      .from("scraper_runs")
      .insert({
        scraper,
        status: "failed",
        source_url: SCRAPER_CONFIGS[scraper].sourceUrl,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        duration_ms: finishedAt.getTime() - startedAt.getTime(),
        triggered_by: triggeredBy,
        summary: { fetched: 0, creates: 0, updates: 0, unchanged: 0, skipped: 0, warnings: 0, errors: 1 },
        error_message: message,
      })
      .select()
      .single()

    if (failedRun) {
      await logAdminAction({
        supabase,
        action: "scraper.auto_failed",
        entityType: "scraper_run",
        entityId: failedRun.id,
        after: failedRun,
        metadata: { scraper, message },
      })
    }

    return { scraper, runId: failedRun?.id, status: "failed", reason: message }
  }
}

export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.SCRAPERS_CRON_SECRET
    const providedSecret = readSecret(request)

    if (!expectedSecret) {
      return NextResponse.json(
        { error: { code: "SERVER_MISCONFIGURED", message: "SCRAPERS_CRON_SECRET is not configured on the server" } },
        { status: 503 },
      )
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
      const diag = {
        hasAuthHeader: !!request.headers.get("authorization"),
        providedPrefix: providedSecret ? providedSecret.slice(0, 4) : null,
        providedLength: providedSecret?.length ?? 0,
        expectedPrefix: expectedSecret?.slice(0, 4) ?? null,
        expectedLength: expectedSecret?.length ?? 0,
      }
      console.error("scrapers/auto auth mismatch:", diag)
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "No autorizado" }, diag },
        { status: 401 },
      )
    }

    const supabase = createAdminClient()
    const results: Array<{
      scraper: ScraperId
      runId?: string
      status: "applied" | "pending_review" | "failed"
      reason: string
      summary?: Record<string, unknown>
    }> = []

    for (const scraper of CRON_SCRAPERS) {
      const result = await tryScraper(scraper, supabase, null)
      results.push(result)
    }

    const applied = results.filter((item) => item.status === "applied").length
    const pendingReview = results.filter((item) => item.status === "pending_review").length
    const failed = results.filter((item) => item.status === "failed").length

    return NextResponse.json({
      ok: failed === 0,
      summary: { applied, pendingReview, failed, total: results.length },
      results,
    })
  } catch (err) {
    console.error("scrapers/auto failed:", err)
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        message: err instanceof Error ? err.message : "Unknown error",
        summary: { applied: 0, pendingReview: 0, failed: 1, total: CRON_SCRAPERS.length },
      },
      { status: 500 },
    )
  }
}
