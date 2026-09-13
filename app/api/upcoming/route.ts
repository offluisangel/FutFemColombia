import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const [matchRes, teamRes] = await Promise.all([
    supabase.from("matches").select("*").eq("phase", "regular").eq("status", "scheduled").order("match_date", { ascending: true }),
    supabase.from("teams").select("id, name"),
  ])

  if (matchRes.error) {
    return NextResponse.json({ error: matchRes.error.message }, { status: 500 })
  }

  const teamMap = new Map((teamRes.data ?? []).map((t) => [t.id, t.name]))
  const upcoming = matchRes.data.map((m) => ({
    local: teamMap.get(m.local_team_id) ?? "Unknown",
    visitante: teamMap.get(m.away_team_id) ?? "Unknown",
    fecha: m.match_date ?? "",
    hora: m.match_time ?? "",
    jornada: m.jornada,
  }))

  return NextResponse.json(upcoming)
}
