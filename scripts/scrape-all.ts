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
import {
  fetchCuadrangularGroupMap,
  inferCuadrangularGroup,
} from "../lib/cuadrangular-groups"
import {
  buildScraperPreview,
  SCRAPER_CONFIGS,
  type ScraperId,
} from "../lib/admin/scrapers"

async function fetchCuadrangularWithFallback(): Promise<CuadrangularFixture[]> {
  // El map equipo->grupo sale de la fuente (standings de la fase), no de una lista fija.
  // Si la fuente no responde, el run falla en voz alta en vez de guardar sin clasificar.
  const groups = await fetchCuadrangularGroupMap()

  let apiFixtures: CuadrangularFixture[] = []
  try {
    const matchdays = await fetchCuadrangularMatchdays()
    apiFixtures = matchdays.flatMap((matchday) =>
      matchday.partidos.flatMap((match) => {
        const group = inferCuadrangularGroup(groups, match.local, match.visitante)
        if (!group) return []
        return [{
          local: match.local,
          visitante: match.visitante,
          fecha: match.fecha ?? "",
          hora: match.hora,
          jornada: matchday.jornada,
          group_name: group,
          golesLocal: match.golesLocal,
          golesVisitante: match.golesVisitante,
          matchStatus: match.matchStatus,
        }]
      }),
    )
  } catch (error) {
    console.warn("API cuadrangular no disponible:", error instanceof Error ? error.message : String(error))
  }

  let htmlFixtures: CuadrangularFixture[] = []
  try {
    htmlFixtures = await scrapeCuadrangularMatchesHTML(groups)
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
  { name: "standings", scraperId: "standings" as const, fetch: fetchStandings, save: (d: unknown, s: SupabaseClient) => saveStandingsToSupabase(d as Awaited<ReturnType<typeof fetchStandings>>, s) },
  { name: "matches", scraperId: "matches" as const, fetch: fetchAllMatchdays, save: (d: unknown, s: SupabaseClient) => saveMatchesToSupabase(d as Awaited<ReturnType<typeof fetchAllMatchdays>>, s, "regular") },
  { name: "results", scraperId: "results" as const, fetch: fetchAllMatchdays, save: (d: unknown, s: SupabaseClient) => saveMatchesToSupabase(d as Awaited<ReturnType<typeof fetchAllMatchdays>>, s, "regular") },
  { name: "cuadrangular", scraperId: "cuadrangular-matches" as const, fetch: fetchCuadrangularWithFallback, save: (d: unknown, s: SupabaseClient) => saveCuadrangularFixturesToSupabase(d as CuadrangularFixture[], s) },
  { name: "scorers", scraperId: "scorers" as const, fetch: fetchScorers, save: (d: unknown, s: SupabaseClient) => saveScorersToSupabase(d as Awaited<ReturnType<typeof fetchScorers>>, s) },
] as const

async function recordRun({
  supabase,
  scraperId,
  status,
  startedAt,
  finishedAt,
  summary,
  preview,
  rawData,
  errorMessage,
}: {
  supabase: SupabaseClient
  scraperId: ScraperId
  status: "applied" | "failed"
  startedAt: Date
  finishedAt: Date
  summary: Record<string, unknown>
  preview?: Awaited<ReturnType<typeof buildScraperPreview>>
  rawData?: unknown
  errorMessage?: string
}) {
  const { error } = await supabase.from("scraper_runs").insert({
    scraper: scraperId,
    status,
    source_url: SCRAPER_CONFIGS[scraperId].sourceUrl,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    duration_ms: finishedAt.getTime() - startedAt.getTime(),
    triggered_by: null,
    summary,
    ...(preview && rawData !== undefined
      ? {
          raw_data: rawData,
          normalized_data: preview.normalized,
          diff: preview.diff,
          warnings: preview.warnings,
        }
      : {}),
    error_message: errorMessage ?? null,
  })
  if (error) {
    throw new Error(`No se pudo registrar el run: ${error.message}`)
  }
}

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
    const startedAt = new Date()
    const label = scraper.name.padEnd(10)
    try {
      console.log(`[${label}] Fetching...`)
      const data = await scraper.fetch()
      console.log(`[${label}] Saving...`)
      await scraper.save(data, supabase)
      const preview = await buildScraperPreview(scraper.scraperId, data, supabase)
      const finishedAt = new Date()
      await recordRun({
        supabase,
        scraperId: scraper.scraperId,
        status: "applied",
        startedAt,
        finishedAt,
        summary: preview.summary,
        preview,
        rawData: data,
      })
      const count = Array.isArray(data) ? data.length : 0
      results.push({ scraper: scraper.name, ok: true, count })
      console.log(`[${label}] OK (${count} items)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const finishedAt = new Date()
      results.push({ scraper: scraper.name, ok: false, error: msg })
      console.error(`[${label}] FAILED: ${msg}`)
      try {
        await recordRun({
          supabase,
          scraperId: scraper.scraperId,
          status: "failed",
          startedAt,
          finishedAt,
          summary: {
            fetched: 0,
            creates: 0,
            updates: 0,
            unchanged: 0,
            skipped: 0,
            warnings: 0,
            errors: 1,
          },
          errorMessage: msg,
        })
      } catch {
        // No oculta ningun error si también falla el registro del run.
      }
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

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})