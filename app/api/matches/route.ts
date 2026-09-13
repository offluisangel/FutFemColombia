import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const [matchRes, teamRes] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .eq("phase", "regular")
      .order("match_date", { ascending: true }),
    supabase.from("teams").select("id, name"),
  ]);

  if (matchRes.error) {
    return NextResponse.json(
      { error: matchRes.error.message },
      { status: 500 },
    );
  }

  const teamMap = new Map((teamRes.data ?? []).map((t) => [t.id, t.name]));
  const grouped: Record<
    number,
    {
      jornada: number;
      fecha: string;
      partidos: {
        local: string;
        visitante: string;
        fecha: string;
        hora: string;
        local_score: number | null;
        away_score: number | null;
      }[];
    }
  > = {};

  for (const m of matchRes.data) {
    const local = teamMap.get(m.local_team_id) ?? "Unknown";
    const visitante = teamMap.get(m.away_team_id) ?? "Unknown";

    if (!grouped[m.jornada]) {
      grouped[m.jornada] = {
        jornada: m.jornada,
        fecha: m.match_date ?? "",
        partidos: [],
      };
    }

    grouped[m.jornada].partidos.push({
      local,
      visitante,
      fecha: m.match_date ?? "",
      hora: m.match_time ?? "",
      local_score: m.local_score,
      away_score: m.away_score,
    });
  }

  return NextResponse.json(Object.values(grouped));
}
