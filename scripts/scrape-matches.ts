import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"
import { saveMatchesToSupabase } from "../lib/save-to-supabase"
import { fetchAllMatchdays } from "../lib/winsports-api"

async function main() {
  const matches = await fetchAllMatchdays()

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )
    await saveMatchesToSupabase(matches, supabase, "regular")
  } else {
    console.log("Supabase credentials not found")
    process.exit(1)
  }
}

if (
  process.argv[1]?.endsWith("scrape-matches.ts") ||
  process.argv[1]?.endsWith("scrape-matches.js")
) {
  main().catch(console.error)
}
