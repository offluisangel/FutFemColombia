import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, getErrorMessage } from "@/lib/admin/api";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  buildScraperPreview,
  isScraperId,
  scrapeWithFallback,
  SCRAPER_CONFIGS,
} from "@/lib/admin/scrapers";

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

  try {
    const { data: rawData, source, warnings: fallbackWarnings } =
      await scrapeWithFallback(base);
    const preview = await buildScraperPreview(base, rawData, supabase);
    const finishedAt = new Date();

    const warnings = [...(preview.warnings ?? []), ...(fallbackWarnings ?? [])];
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

    return NextResponse.json({
      message: `${SCRAPER_CONFIGS[base].label} listo para revisar`,
      runId: run.id,
      scraper: base,
      status: run.status,
      summary,
      warnings,
    });
  } catch (err: unknown) {
    const rawMessage = getErrorMessage(err);
    const message =
      base === "scorers"
        ? `${rawMessage} — Dimayor (Cloudflare) bloquea las IPs de Vercel. Ejecuta el scraper de goleadoras manualmente desde una máquina con acceso (pnpm scrape:scorers).`
        : rawMessage;
    const finishedAt = new Date();
    console.error(`Scrape preview error (${base}):`, err);

    await supabase.from("scraper_runs").insert({
      scraper: base,
      status: "failed",
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

    return apiError(message);
  }
}
