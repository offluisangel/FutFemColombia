import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getErrorMessage } from "@/lib/admin/api";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  BASE_SCRAPERS,
  buildScraperPreview,
  scrapeWithFallback,
  SCRAPER_CONFIGS,
  type ScraperId,
} from "@/lib/admin/scrapers";

export async function POST(req: NextRequest) {
  const { user, response } = await requireAdminUser();
  if (response) return response;

  const supabase = createAdminClient();
  const results: {
    scraper: ScraperId;
    status: string;
    runId?: string;
    summary?: Record<string, unknown>;
    warnings?: string[];
    error?: string;
  }[] = [];

  for (const scraper of BASE_SCRAPERS) {
    const startedAt = new Date();
    try {
      const { data: rawData, source, warnings: fallbackWarnings } =
        await scrapeWithFallback(scraper);
      const preview = await buildScraperPreview(scraper, rawData, supabase);
      const finishedAt = new Date();

      const warnings = [...(preview.warnings ?? []), ...(fallbackWarnings ?? [])];
      const summary = { ...preview.summary, source, warnings: warnings.length };

      const { data: run, error } = await supabase
        .from("scraper_runs")
        .insert({
          scraper,
          status: "pending_review",
          source_url: SCRAPER_CONFIGS[scraper].sourceUrl,
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

      if (error) {
        results.push({ scraper, status: "failed", error: error.message });
      } else {
        results.push({
          scraper,
          status: run.status,
          runId: run.id,
          summary,
          warnings,
        });
      }
    } catch (err: unknown) {
      results.push({ scraper, status: "failed", error: getErrorMessage(err) });
    }
  }

  return NextResponse.json({
    ok: results.every((r) => r.status !== "failed"),
    results,
  });
}