import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"
import { saveResultsToSupabase } from "../lib/save-to-supabase"
import { fetchAllMatchdays } from "../lib/winsports-api"

async function main() {
  const results = await fetchAllMatchdays()

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )
    await saveResultsToSupabase(results, supabase)
  } else {
    console.log("Supabase credentials not found")
    process.exit(1)
  }
}

if (
  process.argv[1]?.endsWith("scrape-results.ts") ||
  process.argv[1]?.endsWith("scrape-results.js")
) {
  main().catch(console.error)
}
