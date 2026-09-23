import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"
import { saveCuadrangularFixturesToSupabase } from "../lib/save-to-supabase"
import { fetchCuadrangularUpcoming } from "../lib/winsports-api"
import { scrapeCuadrangularMatchesHTML, type CuadrangularFixture } from "../lib/winsports-html"
import {
  fetchCuadrangularGroupMap,
  inferCuadrangularGroup,
  type CuadrangularGroupMap,
} from "../lib/cuadrangular-groups"

async function main() {
  let groups: CuadrangularGroupMap = {}
  try {
    groups = await fetchCuadrangularGroupMap()
  } catch (error) {
    console.warn("Standings de cuadrangular no disponibles; se omitirán partidos sin grupo:", error instanceof Error ? error.message : String(error))
  }

  let apiFixtures: CuadrangularFixture[] = []
  try {
    const apiMatches = await fetchCuadrangularUpcoming()
    apiFixtures = apiMatches.flatMap((match) => {
      const group = inferCuadrangularGroup(groups, match.local, match.visitante)
      return group ? [{ ...match, group_name: group }] : []
    })
  } catch (error) {
    console.warn("API cuadrangular no disponible:", error instanceof Error ? error.message : String(error))
  }

  let htmlFixtures: CuadrangularFixture[] = []
  try {
    htmlFixtures = await scrapeCuadrangularMatchesHTML(groups)
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

if (
  process.argv[1]?.endsWith("scrape-upcoming.ts") ||
  process.argv[1]?.endsWith("scrape-upcoming.js")
) {
  main().catch(console.error)
}
