import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"
import { saveStandingsToSupabase } from "../lib/save-to-supabase"
import { fetchStandings } from "../lib/winsports-api"

async function main() {
  const standings = await fetchStandings()

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )
    await saveStandingsToSupabase(standings, supabase)
  } else {
    console.log("Supabase credentials not found")
    process.exit(1)
  }
}

if (
  process.argv[1]?.endsWith("scrape-standings.ts") ||
  process.argv[1]?.endsWith("scrape-standings.js")
) {
  main().catch(console.error)
}
