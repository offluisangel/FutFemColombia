import { describe, expect, it } from "vitest"
import { shouldAutoApply } from "@/lib/admin/scraper-automation"

describe("shouldAutoApply", () => {
  it("no aplica cuando hay errores", () => {
    const res = shouldAutoApply({
      scraper: "standings",
      summary: { fetched: 10, errors: 1 },
    })
    expect(res.apply).toBe(false)
  })

  it("no aplica cuando no trajo datos", () => {
    const res = shouldAutoApply({
      scraper: "standings",
      summary: { fetched: 0 },
    })
    expect(res.apply).toBe(false)
  })

  it("aplica sin señales de riesgo", () => {
    const res = shouldAutoApply({
      scraper: "standings",
      summary: { fetched: 10, errors: 0 },
    })
    expect(res.apply).toBe(true)
  })

  it("no aplica partidos programados sin fecha/hora", () => {
    const res = shouldAutoApply({
      scraper: "upcoming",
      summary: { fetched: 4, errors: 0 },
      normalized: [
        {
          season_id: "s1",
          jornada: 16,
          status: "scheduled",
          match_date: null,
          match_time: null,
        },
        {
          season_id: "s1",
          jornada: 16,
          status: "scheduled",
          match_date: "2026-08-20",
          match_time: "15:00",
        },
      ],
    })
    expect(res.apply).toBe(false)
    expect(res.reason).toContain("1 partido")
  })

  it("aplica cuando los programados traen fecha y hora", () => {
    const res = shouldAutoApply({
      scraper: "upcoming",
      summary: { fetched: 4, errors: 0 },
      normalized: [
        {
          season_id: "s1",
          jornada: 16,
          status: "scheduled",
          match_date: "2026-08-20",
          match_time: "15:00",
        },
      ],
    })
    expect(res.apply).toBe(true)
  })

  it("no aplica cuando hay filas omitidas", () => {
    const res = shouldAutoApply({
      scraper: "matches",
      summary: { fetched: 3, errors: 0 },
      normalized: [
        { label: "X vs Y", skipped: true, reason: "Equipo no encontrado" },
        {
          season_id: "s1",
          jornada: 1,
          status: "played",
          match_date: "2026-02-18",
          match_time: "17:00",
        },
      ],
    })
    expect(res.apply).toBe(false)
    expect(res.reason).toContain("omitidos")
  })
})