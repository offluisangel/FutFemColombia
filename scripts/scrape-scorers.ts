import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"
import { fetchScorers } from "../lib/dimayor-ajax"
import { saveScorersToSupabase } from "../lib/save-to-supabase"
import {
  buildScraperPreview,
  SCRAPER_CONFIGS,
} from "../lib/admin/scrapers"

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase credentials not found")

  const supabase = createClient(url, key)
  const startedAt = new Date()

  try {
    const scorers = await fetchScorers()
    await saveScorersToSupabase(scorers, supabase)
    const preview = await buildScraperPreview("scorers", scorers, supabase)
    const finishedAt = new Date()
    const summary = { ...preview.summary, source: "dimayor" }

    const { error } = await supabase.from("scraper_runs").insert({
      scraper: "scorers",
      status: "applied",
      source_url: SCRAPER_CONFIGS.scorers.sourceUrl,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_ms: finishedAt.getTime() - startedAt.getTime(),
      triggered_by: null,
      summary,
      raw_data: scorers,
      normalized_data: preview.normalized,
      diff: preview.diff,
      warnings: preview.warnings,
    })
    if (error) throw new Error(`No se pudo registrar el run: ${error.message}`)

    console.log(`Saved ${scorers.length} scorers to Supabase (run applied)`)
  } catch (error) {
    const finishedAt = new Date()
    const message = error instanceof Error ? error.message : "Unknown error"
    try {
      await supabase.from("scraper_runs").insert({
        scraper: "scorers",
        status: "failed",
        source_url: SCRAPER_CONFIGS.scorers.sourceUrl,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        duration_ms: finishedAt.getTime() - startedAt.getTime(),
        triggered_by: null,
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
      })
    } catch {
      // No oculta ningun error si también falla el registro del run.
    }
    throw error
  }
}

if (process.argv[1]?.endsWith("scrape-scorers.ts") || process.argv[1]?.endsWith("scrape-scorers.js")) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
