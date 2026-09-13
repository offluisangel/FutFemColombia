import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"
import { fetchCuadrangularMatchdays } from "../lib/winsports-api"
import { scrapeCuadrangularMatchesHTML, type CuadrangularFixture } from "../lib/winsports-html"
import { saveCuadrangularFixturesToSupabase } from "../lib/save-to-supabase"

async function main() {
  // Fixtures cuadrangular 2026 — desde 23 ago la API ya publica F1-F3 (12 partidos).
  // El seed de 4 J1 sin fecha/hora queda solo como último fallback si la API/HTML fallan.
  const seed: CuadrangularFixture[] = [
    { local: "Millonarios", visitante: "Inter de Bogotá", fecha: "", hora: "", jornada: 1, group_name: "A" },
    { local: "Inter Palmira", visitante: "Atl. Nacional", fecha: "", hora: "", jornada: 1, group_name: "A" },
    { local: "América", visitante: "Cali", fecha: "", hora: "", jornada: 1, group_name: "B" },
    { local: "Santa Fe", visitante: "Orsomarso", fecha: "", hora: "", jornada: 1, group_name: "B" },
  ]

  let fixtures: CuadrangularFixture[] = []

  // 1. Obtener todo lo publicado por la API cuadrangular.
  try {
    const matchdays = await fetchCuadrangularMatchdays()
    if (matchdays.length > 0) {
      fixtures = matchdays.flatMap((md) =>
        md.partidos.map((p) => ({
          local: p.local,
          visitante: p.visitante,
          fecha: p.fecha ?? "",
          hora: p.hora,
          jornada: md.jornada,
          group_name: inferGroup(p.local, p.visitante),
          golesLocal: p.golesLocal,
          golesVisitante: p.golesVisitante,
          matchStatus: p.matchStatus,
        })),
      )
      console.log(`Cuadrangular fixtures via API: ${fixtures.length} partidos (F1-F${matchdays.length})`)
    }
  } catch (e) {
    console.warn("API cuadrangular no disponible:", (e as Error).message)
  }

  // 2. El HTML puede publicar jornadas nuevas antes que la API; combinar ambas fuentes.
  try {
    const htmlFixtures = await scrapeCuadrangularMatchesHTML()
    const merged = new Map<string, CuadrangularFixture>()
    for (const fixture of [...fixtures, ...htmlFixtures]) {
      const key = `${fixture.jornada}|${fixture.local}|${fixture.visitante}`
      merged.set(key, fixture)
    }
    fixtures = Array.from(merged.values())
    console.log(`Fixtures cuadrangulares combinados: ${fixtures.length} partidos`)
  } catch (e) {
    console.warn("HTML cuadrangular no disponible:", (e as Error).message)
  }

  // 3. Fallback: seed de los 4 anunciados (sin fecha/hora)
  if (fixtures.length === 0) {
    fixtures = seed
    console.log("Usando seed de 4 partidos anunciados (sin fecha/hora)")
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase credentials not found")
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  await saveCuadrangularFixturesToSupabase(fixtures, supabase)
}

function inferGroup(local: string, visitante: string): "A" | "B" {
  const map: Record<string, "A" | "B"> = {
    "Atl. Nacional": "A",
    "Inter de Bogotá": "A",
    "Inter Palmira": "A",
    "Millonarios": "A",
    "Cali": "B",
    "América": "B",
    "Santa Fe": "B",
    "Orsomarso": "B",
  }
  return map[local] ?? map[visitante] ?? "A"
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
