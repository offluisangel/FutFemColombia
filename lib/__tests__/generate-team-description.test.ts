import { describe, expect, it } from "vitest"
import { generateTeamDescription } from "@/lib/generate-team-description"

function team(overrides: Partial<Record<string, number | string>> = {}) {
  return {
    pos: 1,
    name: "Cali",
    pts: 30,
    pj: 12,
    pg: 9,
    pe: 3,
    pp: 0,
    gf: 25,
    gc: 8,
    dif: 17,
    ...overrides,
  }
}

describe("generateTeamDescription", () => {
  it("incluye posición, puntos y temporada", () => {
    const text = generateTeamDescription("Deportivo Cali", team(), [])
    expect(text).toContain("2026")
    expect(text).toContain("1")
    expect(text).toContain("30 puntos")
  })

  it("menciona racha de victorias consecutivas (>=2)", () => {
    const results = [
      {
        jornada: 1,
        fecha: "2026-02-01",
        partidos: [
          { local: "Cali", golesLocal: 2, visitante: "Pasto", golesVisitante: 0 },
          { local: "Bogotá", golesLocal: 0, visitante: "Cali", golesVisitante: 3 },
        ],
      },
    ]
    const text = generateTeamDescription("Cali", team(), results)
    expect(text).toContain("2 victorias consecutivas")
  })

  it("no menciona racha si los resultados son mixtos", () => {
    const results = [
      {
        jornada: 1,
        fecha: "2026-02-01",
        partidos: [
          { local: "Cali", golesLocal: 2, visitante: "Pasto", golesVisitante: 0 },
          { local: "Cali", golesLocal: 0, visitante: "Llaneros", golesVisitante: 1 },
        ],
      },
    ]
    const text = generateTeamDescription("Cali", team(), results)
    expect(text).not.toContain("consecutivas")
  })

  it("incluye mención de campeón cuando aplica", () => {
    const text = generateTeamDescription("Cali", team(), [], "champion")
    expect(text).toContain("campeón")
  })

  it("incluye mención de participación finalizada cuando está eliminado", () => {
    const text = generateTeamDescription("Cali", team(), [], "eliminated")
    expect(text).toContain("participación en la temporada 2026 ya finalizó")
  })
})