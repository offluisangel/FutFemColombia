import { describe, expect, it } from "vitest"
import { generateTeamMetadata } from "@/lib/generate-team-metadata"

describe("generateTeamMetadata", () => {
  it("prioriza posiciones, resultados y temporada para equipos activos", () => {
    const metadata = generateTeamMetadata("Millonarios Femenino", "active", 2026)

    expect(metadata.title).toBe("Millonarios Femenino: Posiciones y resultados 2026")
    expect(metadata.description).toContain("posiciones, resultados y próximos partidos")
    expect(metadata.description).toContain("Liga Femenina de Colombia 2026")
  })

  it("describe correctamente a campeones y equipos eliminados", () => {
    const champion = generateTeamMetadata("Cali Femenino", "champion", 2026)
    const eliminated = generateTeamMetadata("Pasto Femenino", "eliminated", 2026)

    expect(champion.title).toContain("Campeón")
    expect(champion.description).toContain("se coronó campeón")
    expect(eliminated.title).toContain("posición final")
    expect(eliminated.description).toContain("resultados y posición final")
  })
})
