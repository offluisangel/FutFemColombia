import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"
import { fetchStageStandings } from "../lib/winsports-api"
import { scrapeStageStandingsHTML } from "../lib/winsports-html"
import { saveStageStandingsToSupabase } from "../lib/save-to-supabase"

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
  await saveStageStandingsToSupabase(stageStandings, supabase)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
