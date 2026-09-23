import type { ScraperRun } from "@/lib/types/supabase"

export type SyncRunLite = Pick<
  ScraperRun,
  "id" | "scraper" | "status" | "started_at" | "created_at"
>

function runTimestamp(run: Pick<SyncRunLite, "created_at" | "started_at">) {
  return Date.parse(run.created_at || run.started_at)
}

/**
 * Latest run per scraper. When `scraperIds` is provided the result only
 * contains those scrapers; otherwise it includes every scraper found in
 * `runs`.
 */
export function latestRunsByScraper(
  runs: SyncRunLite[],
  scraperIds?: string[],
): Record<string, SyncRunLite | undefined> {
  const latest = new Map<string, SyncRunLite>()

  for (const run of runs) {
    const current = latest.get(run.scraper)
    if (!current || runTimestamp(run) > runTimestamp(current)) {
      latest.set(run.scraper, run)
    }
  }

  const ids = scraperIds ?? [...latest.keys()]
  return Object.fromEntries(ids.map((id) => [id, latest.get(id)]))
}