import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, getErrorMessage } from "@/lib/admin/api";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  applyScraperData,
  buildScraperPreview,
  isScraperId,
  scrapeWithFallback,
  SCRAPER_CONFIGS,
} from "@/lib/admin/scrapers";
import { shouldAutoApply } from "@/lib/admin/scraper-automation";
import { logAdminAction } from "@/lib/admin/audit";

export async function POST(req: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (response) return response;

  const { scraper } = await req.json();
  const base = typeof scraper === "string" ? scraper.replace("-html", "") : scraper;
  if (!isScraperId(base)) {
    return apiError(`Unknown scraper: ${scraper}`, 400, "UNKNOWN_SCRAPER");
  }

  const supabase = createAdminClient();
  const startedAt = new Date();
  let runId: string | null = null;

  try {
    const { data: rawData, source, warnings: fallbackWarnings } =
      await scrapeWithFallback(base);
    const preview = await buildScraperPreview(base, rawData, supabase);
    const finishedAt = new Date();

    const warnings = [...(preview.warnings ?? []), ...(fallbackWarnings ?? [])];
    const decision = shouldAutoApply({
      scraper: base,
      summary: {
        ...preview.summary,
        warnings: preview.summary.warnings + (fallbackWarnings?.length ?? 0),
      },
      normalized: preview.normalized,
    });
    const summary = { ...preview.summary, source, warnings: warnings.length };

    const { data: run, error } = await supabase
      .from("scraper_runs")
      .insert({
        scraper: base,
        status: "pending_review",
        source_url: SCRAPER_CONFIGS[base].sourceUrl,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        duration_ms: finishedAt.getTime() - startedAt.getTime(),
        triggered_by: user.id,
        summary,
        raw_data: rawData,
        normalized_data: preview.normalized,
        diff: preview.diff,
        warnings,
      })
      .select()
      .single();

    if (error) return apiError(error.message);
    runId = run.id;

    if (decision.apply) {
      await applyScraperData(base, rawData, supabase);
      const { data: appliedRun, error: updateError } = await supabase
        .from("scraper_runs")
        .update({ status: "applied", applied_at: new Date().toISOString() })
        .eq("id", run.id)
        .select()
        .single();

      if (updateError || !appliedRun) {
        throw new Error(updateError?.message ?? "No se pudo marcar la ejecución como aplicada");
      }

      await logAdminAction({
        supabase,
        userId: user.id,
        action: "scraper.auto_applied",
        entityType: "scraper_run",
        entityId: run.id,
        after: appliedRun,
        metadata: { scraper: base, summary, reason: decision.reason },
      });

      return NextResponse.json({
        message: `${SCRAPER_CONFIGS[base].label} aplicado automáticamente`,
        runId: run.id,
        scraper: base,
        status: appliedRun.status,
        summary,
        warnings,
        reason: decision.reason,
      });
    }

    const reviewWarnings = [...warnings, `Auto-review: ${decision.reason}`];
    await supabase
      .from("scraper_runs")
      .update({ warnings: reviewWarnings, summary: { ...summary, warnings: reviewWarnings.length } })
      .eq("id", run.id);
    await logAdminAction({
      supabase,
      userId: user.id,
      action: "scraper.auto_previewed",
      entityType: "scraper_run",
      entityId: run.id,
      after: { ...run, warnings: reviewWarnings },
      metadata: { scraper: base, summary, reason: decision.reason },
    });

    return NextResponse.json({
      message: `${SCRAPER_CONFIGS[base].label} listo para revisar`,
      runId: run.id,
      scraper: base,
      status: run.status,
      summary,
      warnings: reviewWarnings,
      reason: decision.reason,
    });
  } catch (err: unknown) {
    const rawMessage = getErrorMessage(err);
    const message =
      base === "scorers"
        ? `${rawMessage} — Dimayor (Cloudflare) bloquea las IPs de Vercel. Ejecuta el scraper de goleadoras manualmente desde una máquina con acceso (pnpm scrape:scorers).`
        : rawMessage;
    const finishedAt = new Date();
    console.error(`Scrape preview error (${base}):`, err);

    // Goleadoras solo se puede ejecutar localmente: Dimayor bloquea la IP de
    // Vercel con 403, así que no es un fallo de la infraestructura. Marcarlo
    // como "skipped" evita ruido crónico en el dashboard de decisiones.
    const failureStatus = base === "scorers" ? "skipped" : "failed";

    if (runId) {
      const { data: failedRun } = await supabase
        .from("scraper_runs")
        .update({ status: failureStatus, error_message: message })
        .eq("id", runId)
        .select()
        .single();
      await logAdminAction({
        supabase,
        userId: user.id,
        action: "scraper.auto_failed",
        entityType: "scraper_run",
        entityId: runId,
        after: failedRun,
        metadata: { scraper: base, message },
      });
    } else {
      await supabase.from("scraper_runs").insert({
        scraper: base,
        status: failureStatus,
        source_url: SCRAPER_CONFIGS[base].sourceUrl,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        duration_ms: finishedAt.getTime() - startedAt.getTime(),
        triggered_by: user.id,
        summary: {
          fetched: 0,
          creates: 0,
          updates: 0,
          unchanged: 0,
          skipped: 0,
          warnings: 0,
          errors: 1,
        },
        error_message: message,
      });
    }

    return apiError(message);
  }
}
