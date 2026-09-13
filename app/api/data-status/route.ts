import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const [teamsRes, matchesRes, seasonsRes] = await Promise.all([
    supabase.from("teams").select("created_at").order("created_at", { ascending: false }).limit(1),
    supabase.from("matches").select("created_at").order("created_at", { ascending: false }).limit(1),
    supabase.from("seasons").select("created_at").order("created_at", { ascending: false }).limit(1),
  ])

  return NextResponse.json({
    supabase: {
      teams: teamsRes.data?.[0]?.created_at ?? null,
      matches: matchesRes.data?.[0]?.created_at ?? null,
      seasons: seasonsRes.data?.[0]?.created_at ?? null,
    },
  })
}
