import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import {
  scrapeStandingsHTML,
  scrapeResultsHTML,
  scrapeCuadrangularMatchesHTML,
  type CuadrangularFixture,
} from "../lib/winsports-html"
import {
  saveStandingsToSupabase,
  saveMatchesToSupabase,
  saveCuadrangularFixturesToSupabase,
} from "../lib/save-to-supabase"

const SCRAPERS = [
  { name: "standings", fetch: scrapeStandingsHTML, save: (d: unknown, s: SupabaseClient) => saveStandingsToSupabase(d as Awaited<ReturnType<typeof scrapeStandingsHTML>>, s) },
  { name: "results", fetch: scrapeResultsHTML, save: (d: unknown, s: SupabaseClient) => saveMatchesToSupabase(d as Awaited<ReturnType<typeof scrapeResultsHTML>>, s, "regular") },
  { name: "cuadrangular", fetch: scrapeCuadrangularMatchesHTML, save: (d: unknown, s: SupabaseClient) => saveCuadrangularFixturesToSupabase(d as CuadrangularFixture[], s) },
] as const

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error("Supabase credentials not found")
    process.exit(1)
  }

  const supabase = createClient(url, key)

  for (const scraper of SCRAPERS) {
    const label = scraper.name.padEnd(12)
    try {
      console.log(`[${label}] Scraping HTML...`)
      const data = await scraper.fetch()
      const count = Array.isArray(data) ? data.length : 0
      console.log(`[${label}] ${count} items obtenidos. Guardando...`)
      await scraper.save(data, supabase)
      console.log(`[${label}] OK`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[${label}] FAILED: ${msg}`)
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})