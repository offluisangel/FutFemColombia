import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan credenciales")
  const supabase = createClient(url, key)

  const { data: seasons } = await supabase.from("seasons").select("id, name, is_active")
  const active = seasons?.find((s) => s.is_active)
  if (!active) return console.log("No hay temporada activa")

  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, jornada, phase, tie_key, leg, local_team_id, away_team_id, local_score, away_score, match_date, status")
    .eq("season_id", active.id)
    .in("phase", ["semifinal", "final"])

  if (error) return console.error("Error:", error.message)

  const { data: teams } = await supabase.from("teams").select("id, name")
  const name = new Map((teams ?? []).map((t) => [t.id, t.name]))

  for (const m of matches ?? []) {
    console.log(
      `[${m.phase}] J${m.jornada ?? "-"} leg=${m.leg ?? "-"} key=${m.tie_key ?? "-"} | ${name.get(m.local_team_id)} vs ${name.get(m.away_team_id)} | ${m.local_score ?? "-"}-${m.away_score ?? "-"} | fecha=${m.match_date ?? "-"} | ${m.status}`,
    )
  }
  console.log("Total:", (matches ?? []).length)
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})