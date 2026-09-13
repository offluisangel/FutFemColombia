import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import {
  fetchStandings,
  fetchAllMatchdays,
  fetchCuadrangularMatchdays,
} from "../lib/winsports-api"
import {
  saveStandingsToSupabase,
  saveMatchesToSupabase,
  saveCuadrangularFixturesToSupabase,
  saveScorersToSupabase,
} from "../lib/save-to-supabase"
import { fetchScorers } from "../lib/dimayor-ajax"
import { scrapeCuadrangularMatchesHTML, type CuadrangularFixture } from "../lib/winsports-html"

async function fetchCuadrangularWithFallback(): Promise<CuadrangularFixture[]> {
  let apiFixtures: CuadrangularFixture[] = []
  try {
    const matchdays = await fetchCuadrangularMatchdays()
    apiFixtures = matchdays.flatMap((matchday) => matchday.partidos.map((match) => ({
      local: match.local,
      visitante: match.visitante,
      fecha: match.fecha ?? "",
      hora: match.hora,
      jornada: matchday.jornada,
      group_name: inferGroup(match.local, match.visitante),
      golesLocal: match.golesLocal,
      golesVisitante: match.golesVisitante,
      matchStatus: match.matchStatus,
    })))
  } catch (error) {
    console.warn("API cuadrangular no disponible:", error instanceof Error ? error.message : String(error))
  }

  let htmlFixtures: CuadrangularFixture[] = []
  try {
    htmlFixtures = await scrapeCuadrangularMatchesHTML()
  } catch (error) {
    console.warn("HTML cuadrangular no disponible:", error instanceof Error ? error.message : String(error))
  }

  const merged = new Map<string, CuadrangularFixture>()
  for (const fixture of [...apiFixtures, ...htmlFixtures]) {
    const key = `${fixture.jornada}|${fixture.local}|${fixture.visitante}`
    merged.set(key, fixture)
  }
  return Array.from(merged.values())
}

const SCRAPERS = [
  { name: "standings", fetch: fetchStandings, save: (d: unknown, s: SupabaseClient) => saveStandingsToSupabase(d as Awaited<ReturnType<typeof fetchStandings>>, s) },
  { name: "matches", fetch: fetchAllMatchdays, save: (d: unknown, s: SupabaseClient) => saveMatchesToSupabase(d as Awaited<ReturnType<typeof fetchAllMatchdays>>, s, "regular") },
  { name: "results", fetch: fetchAllMatchdays, save: (d: unknown, s: SupabaseClient) => saveMatchesToSupabase(d as Awaited<ReturnType<typeof fetchAllMatchdays>>, s, "regular") },
  { name: "cuadrangular", fetch: fetchCuadrangularWithFallback, save: (d: unknown, s: SupabaseClient) => saveCuadrangularFixturesToSupabase(d as CuadrangularFixture[], s) },
  { name: "scorers", fetch: fetchScorers, save: (d: unknown, s: SupabaseClient) => saveScorersToSupabase(d as Awaited<ReturnType<typeof fetchScorers>>, s) },
] as const

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error("Supabase credentials not found")
    process.exit(1)
  }

  const supabase = createClient(url, key) as unknown as SupabaseClient
  const results: { scraper: string; ok: boolean; count?: number; error?: string }[] = []

  for (const scraper of SCRAPERS) {
    const label = scraper.name.padEnd(10)
    try {
      console.log(`[${label}] Fetching...`)
      const data = await scraper.fetch()
      console.log(`[${label}] Saving...`)
      await scraper.save(data, supabase)
      const count = Array.isArray(data) ? data.length : 0
      results.push({ scraper: scraper.name, ok: true, count })
      console.log(`[${label}] OK (${count} items)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ scraper: scraper.name, ok: false, error: msg })
      console.error(`[${label}] FAILED: ${msg}`)
    }
  }

  console.log("\n--- RESULTADOS ---")
  for (const r of results) {
    const status = r.ok ? "✓" : "✗"
    const detail = r.ok ? `${r.count} items` : r.error
    console.log(`  ${status} ${r.scraper.padEnd(10)} ${detail}`)
  }

  const failed = results.filter((r) => !r.ok)
  if (failed.length > 0) process.exit(1)
}

function inferGroup(local: string, visitante: string): "A" | "B" {
  const groups: Record<string, "A" | "B"> = {
    "Atl. Nacional": "A",
    "Inter de Bogotá": "A",
    "Inter Palmira": "A",
    Millonarios: "A",
    Cali: "B",
    América: "B",
    "Santa Fe": "B",
    Orsomarso: "B",
  }
  const localGroup = groups[local]
  const awayGroup = groups[visitante]
  if (!localGroup || localGroup !== awayGroup) {
    throw new Error(`Partido no válido para cuadrangulares: ${local} vs ${visitante}`)
  }
  return localGroup
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})