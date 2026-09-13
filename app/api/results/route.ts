import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const [matchRes, teamRes] = await Promise.all([
    supabase.from("matches").select("*").eq("phase", "regular").eq("status", "played").order("match_date", { ascending: false }).limit(50),
    supabase.from("teams").select("id, name"),
  ])

  if (matchRes.error) {
    return NextResponse.json({ error: matchRes.error.message }, { status: 500 })
  }

  const teamMap = new Map((teamRes.data ?? []).map((t) => [t.id, t.name]))
  const grouped: Record<number, { jornada: number; fecha: string; partidos: { local: string; golesLocal: number; visitante: string; golesVisitante: number; hora: string }[] }> = {}

  for (const m of matchRes.data) {
    const local = teamMap.get(m.local_team_id) ?? "Unknown"
    const visitante = teamMap.get(m.away_team_id) ?? "Unknown"

    if (!grouped[m.jornada]) {
      grouped[m.jornada] = { jornada: m.jornada, fecha: m.match_date ?? "", partidos: [] }
    }

    grouped[m.jornada].partidos.push({
      local,
      golesLocal: m.local_score ?? 0,
      visitante,
      golesVisitante: m.away_score ?? 0,
      hora: m.match_time ?? "",
    })
  }

  return NextResponse.json(Object.values(grouped))
}
