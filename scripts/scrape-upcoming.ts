import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"
import { saveCuadrangularFixturesToSupabase } from "../lib/save-to-supabase"
import { fetchCuadrangularUpcoming } from "../lib/winsports-api"
import { scrapeCuadrangularMatchesHTML, type CuadrangularFixture } from "../lib/winsports-html"

async function main() {
  let apiFixtures: CuadrangularFixture[] = []
  try {
    const apiMatches = await fetchCuadrangularUpcoming()
    apiFixtures = apiMatches.map((match) => ({
      ...match,
      group_name: inferGroup(match.local, match.visitante),
    }))
  } catch (error) {
    console.warn("API cuadrangular no disponible:", error instanceof Error ? error.message : String(error))
  }

  let htmlFixtures: CuadrangularFixture[] = []
  try {
    htmlFixtures = await scrapeCuadrangularMatchesHTML()
  } catch (error) {
    console.warn("HTML cuadrangular no disponible:", error instanceof Error ? error.message : String(error))
  }

  const matches = mergeFixtures(apiFixtures, htmlFixtures)
  console.log(`Cuadrangulares via API + HTML: ${matches.length} partidos`)

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )
    await saveCuadrangularFixturesToSupabase(matches, supabase)
  } else {
    console.log("Supabase credentials not found")
    process.exit(1)
  }
}

function mergeFixtures(...sources: CuadrangularFixture[][]): CuadrangularFixture[] {
  const merged = new Map<string, CuadrangularFixture>()
  for (const fixtures of sources) {
    for (const fixture of fixtures) {
      const key = `${fixture.jornada}|${fixture.local}|${fixture.visitante}`
      merged.set(key, fixture)
    }
  }
  return Array.from(merged.values())
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

if (
  process.argv[1]?.endsWith("scrape-upcoming.ts") ||
  process.argv[1]?.endsWith("scrape-upcoming.js")
) {
  main().catch(console.error)
}
