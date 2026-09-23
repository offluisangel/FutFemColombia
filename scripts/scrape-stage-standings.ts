import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"
import { fetchStageStandings } from "../lib/winsports-api"
import { scrapeStageStandingsHTML } from "../lib/winsports-html"
import { saveStageStandingsToSupabase } from "../lib/save-to-supabase"
import {
  buildScraperPreview,
  SCRAPER_CONFIGS,
} from "../lib/admin/scrapers"

async function main() {
  let stageStandings: Awaited<ReturnType<typeof fetchStageStandings>>
  try {
    stageStandings = await fetchStageStandings()
    console.log("Stage standings via API (84n6bl7fg3hut5al91qnc9ams)")
  } catch (e) {
    console.warn("API standings falló, probando HTML:", (e as Error).message)
    stageStandings = await scrapeStageStandingsHTML()
    console.log("Stage standings via HTML")
  }
  const groupA = stageStandings.A.length
  const groupB = stageStandings.B.length
  if (groupA !== 4 || groupB !== 4) {
    throw new Error(`Se esperaban 4 equipos por grupo y Win devolvió A=${groupA}, B=${groupB}`)
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase credentials not found")
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
  const startedAt = new Date()

  try {
    await saveStageStandingsToSupabase(stageStandings, supabase)
    const preview = await buildScraperPreview("stage-standings", stageStandings, supabase)
    const finishedAt = new Date()

    const { error } = await supabase.from("scraper_runs").insert({
      scraper: "stage-standings",
      status: "applied",
      source_url: SCRAPER_CONFIGS["stage-standings"].sourceUrl,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_ms: finishedAt.getTime() - startedAt.getTime(),
      triggered_by: null,
      summary: preview.summary,
      raw_data: stageStandings,
      normalized_data: preview.normalized,
      diff: preview.diff,
      warnings: preview.warnings,
    })
    if (error) throw new Error(`No se pudo registrar el run: ${error.message}`)

    console.log("Stage standings saved to Supabase (run applied)")
  } catch (error) {
    const finishedAt = new Date()
    const message = error instanceof Error ? error.message : "Unknown error"
    try {
      await supabase.from("scraper_runs").insert({
        scraper: "stage-standings",
        status: "failed",
        source_url: SCRAPER_CONFIGS["stage-standings"].sourceUrl,
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

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})