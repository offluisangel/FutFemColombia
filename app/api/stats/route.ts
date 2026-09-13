import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const [teamsRes, matchesRes] = await Promise.all([
    supabase.from("teams").select("id", { count: "exact", head: true }),
    supabase.from("matches").select("local_score, away_score, status, jornada").order("jornada", { ascending: false }),
  ])

  if (teamsRes.error || matchesRes.error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const played = matchesRes.data.filter((m) => m.status === "played")
  const goles = played.reduce((sum, m) => sum + (m.local_score ?? 0) + (m.away_score ?? 0), 0)

  const stats = {
    equipos: teamsRes.count ?? 0,
    partidosJugados: played.length,
    goles,
    jornadaActual: matchesRes.data[0]?.jornada ?? 0,
  }

  return NextResponse.json(stats)
}
