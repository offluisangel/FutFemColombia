import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"
import { fetchCuadrangularMatchdays } from "../lib/winsports-api"
import { scrapeCuadrangularMatchesHTML, type CuadrangularFixture } from "../lib/winsports-html"
import {
  fetchCuadrangularGroupMap,
  inferCuadrangularGroup,
  type CuadrangularGroupMap,
} from "../lib/cuadrangular-groups"
import { saveCuadrangularFixturesToSupabase } from "../lib/save-to-supabase"
import {
  buildScraperPreview,
  SCRAPER_CONFIGS,
} from "../lib/admin/scrapers"

async function main() {
  // Fixtures cuadrangular 2026 — desde 23 ago la API ya publica F1-F3 (12 partidos).
  // El seed de 4 J1 sin fecha/hora queda solo como último fallback si la API/HTML fallan.
  const seed: CuadrangularFixture[] = [
    { local: "Millonarios", visitante: "Inter de Bogotá", fecha: "", hora: "", jornada: 1, group_name: "A" },
    { local: "Inter Palmira", visitante: "Atl. Nacional", fecha: "", hora: "", jornada: 1, group_name: "A" },
    { local: "América", visitante: "Cali", fecha: "", hora: "", jornada: 1, group_name: "B" },
    { local: "Santa Fe", visitante: "Orsomarso", fecha: "", hora: "", jornada: 1, group_name: "B" },
  ]

  let fixtures: CuadrangularFixture[] = []

  let groups: CuadrangularGroupMap = {}
  try {
    groups = await fetchCuadrangularGroupMap()
  } catch (error) {
    console.warn("Standings de cuadrangular no disponibles; se omitirán partidos sin grupo:", error instanceof Error ? error.message : String(error))
  }

  // 1. Obtener todo lo publicado por la API cuadrangular.
  try {
    const matchdays = await fetchCuadrangularMatchdays()
    if (matchdays.length > 0) {
      fixtures = matchdays.flatMap((md) =>
        md.partidos.flatMap((p) => {
          const group = inferCuadrangularGroup(groups, p.local, p.visitante)
          if (!group) return []
          return [{
            local: p.local,
            visitante: p.visitante,
            fecha: p.fecha ?? "",
            hora: p.hora,
            jornada: md.jornada,
            group_name: group,
            golesLocal: p.golesLocal,
            golesVisitante: p.golesVisitante,
            matchStatus: p.matchStatus,
          }]
        }),
      )
      console.log(`Cuadrangular fixtures via API: ${fixtures.length} partidos (F1-F${matchdays.length})`)
    }
  } catch (e) {
    console.warn("API cuadrangular no disponible:", (e as Error).message)
  }

  // 2. El HTML puede publicar jornadas nuevas antes que la API; combinar ambas fuentes.
  try {
    const htmlFixtures = await scrapeCuadrangularMatchesHTML(groups)
    const merged = new Map<string, CuadrangularFixture>()
    for (const fixture of [...fixtures, ...htmlFixtures]) {
      const key = `${fixture.jornada}|${fixture.local}|${fixture.visitante}`
      merged.set(key, fixture)
    }
    fixtures = Array.from(merged.values())
    console.log(`Fixtures cuadrangulares combinados: ${fixtures.length} partidos`)
  } catch (e) {
    console.warn("HTML cuadrangular no disponible:", (e as Error).message)
  }

  // 3. Fallback: seed de los 4 anunciados (sin fecha/hora)
  if (fixtures.length === 0) {
    fixtures = seed
    console.log("Usando seed de 4 partidos anunciados (sin fecha/hora)")
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase credentials not found")
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const startedAt = new Date()

  try {
    await saveCuadrangularFixturesToSupabase(fixtures, supabase)
    const preview = await buildScraperPreview("cuadrangular-matches", fixtures, supabase)
    const finishedAt = new Date()

    const { error } = await supabase.from("scraper_runs").insert({
      scraper: "cuadrangular-matches",
      status: "applied",
      source_url: SCRAPER_CONFIGS["cuadrangular-matches"].sourceUrl,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_ms: finishedAt.getTime() - startedAt.getTime(),
      triggered_by: null,
      summary: preview.summary,
      raw_data: fixtures,
      normalized_data: preview.normalized,
      diff: preview.diff,
      warnings: preview.warnings,
    })
    if (error) throw new Error(`No se pudo registrar el run: ${error.message}`)

    console.log(`Cuadrangular fixtures saved to Supabase (run applied, ${fixtures.length} partidos)`)
  } catch (error) {
    const finishedAt = new Date()
    const message = error instanceof Error ? error.message : "Unknown error"
    try {
      await supabase.from("scraper_runs").insert({
        scraper: "cuadrangular-matches",
        status: "failed",
        source_url: SCRAPER_CONFIGS["cuadrangular-matches"].sourceUrl,
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