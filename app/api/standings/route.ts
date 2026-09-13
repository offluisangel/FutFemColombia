import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const [standingsRes, teamsRes] = await Promise.all([
    supabase.from("standings").select("*").order("pos", { ascending: true }),
    supabase.from("teams").select("id, name, slug, shield_url"),
  ])

  if (standingsRes.error || teamsRes.error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const teamInfo = new Map((teamsRes.data ?? []).map((t) => [t.id, { name: t.name, slug: t.slug, shield_url: t.shield_url }]))

  const standings = (standingsRes.data ?? []).map((row) => {
    const info = teamInfo.get(row.team_id) ?? { name: "", slug: "", shield_url: "" }
    return {
      pos: row.pos,
      name: info.name,
      slug: info.slug,
      shield_url: info.shield_url,
      pts: row.pts,
      pj: row.pj,
      pg: row.pg,
      pe: row.pe,
      pp: row.pp,
      gf: row.gf,
      gc: row.gc,
      dif: row.dif,
    }
  })

  return NextResponse.json(standings)
}
