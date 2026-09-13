import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  scrapeWithFallback,
  applyScraperData,
  buildScraperPreview,
  isScraperId,
} from "@/lib/admin/scrapers"

vi.mock("@/lib/winsports-html", () => ({
  scrapeStandingsHTML: vi.fn(),
  scrapeResultsHTML: vi.fn(),
  scrapeUpcomingHTML: vi.fn(),
  scrapeAllMatchdaysHTML: vi.fn(),
}))

vi.mock("@/lib/winsports-api", () => ({
  fetchStandings: vi.fn(),
  fetchAllMatchdays: vi.fn(),
  fetchUpcomingWeeks: vi.fn(),
}))

vi.mock("@/lib/save-to-supabase", () => ({
  saveMatchesToSupabase: vi.fn(),
  saveResultsToSupabase: vi.fn(),
  saveStandingsToSupabase: vi.fn(),
  saveUpcomingToSupabase: vi.fn(),
}))

import * as html from "@/lib/winsports-html"
import * as api from "@/lib/winsports-api"
import * as save from "@/lib/save-to-supabase"

type Row = Record<string, unknown>

function buildSupabaseMock(tables: Record<string, Row[]>) {
  const root: any = {}
  let currentTable = ""
  root.from = (t: string) => {
    currentTable = t
    const q: any = {
      select: () => q,
      eq: () => q,
      single: () =>
        Promise.resolve({ data: tables[currentTable]?.[0] ?? null, error: null }),
      maybeSingle: () =>
        Promise.resolve({ data: tables[currentTable]?.[0] ?? null, error: null }),
      then: (res: any) =>
        Promise.resolve({ data: tables[currentTable] ?? [], error: null }).then(res),
    }
    return q
  }
  return { supabase: root as unknown as SupabaseClient, tables }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("isScraperId", () => {
  it("valida nombres de scrapers", () => {
    expect(isScraperId("standings")).toBe(true)
    expect(isScraperId("standings-html")).toBe(true)
    expect(isScraperId("results-html")).toBe(true)
    expect(isScraperId("bogus")).toBe(false)
  })
})

describe("scrapeWithFallback", () => {
  it("usa el variante HTML si tiene datos completos", async () => {
    vi.mocked(html.scrapeStandingsHTML).mockResolvedValue([
      { pos: 1, name: "Cali", pts: 3, pj: 1, pg: 1, pe: 0, pp: 0, gf: 2, gc: 0, dif: 2 },
    ])
    const result = await scrapeWithFallback("standings")
    expect(result.source).toBe("html")
    expect(html.scrapeStandingsHTML).toHaveBeenCalled()
    expect(api.fetchStandings).not.toHaveBeenCalled()
  })

  it("cae a la API si el HTML viene vacío", async () => {
    vi.mocked(html.scrapeStandingsHTML).mockResolvedValue([])
    vi.mocked(api.fetchStandings).mockResolvedValue([
      { pos: 1, name: "Cali", pts: 3, pj: 1, pg: 1, pe: 0, pp: 0, gf: 2, gc: 0, dif: 2 },
    ])
    const result = await scrapeWithFallback("standings")
    expect(result.source).toBe("api")
    expect(api.fetchStandings).toHaveBeenCalled()
  })

  it("cae a la API si el HTML falla", async () => {
    vi.mocked(html.scrapeStandingsHTML).mockRejectedValue(new Error("boom"))
    vi.mocked(api.fetchStandings).mockResolvedValue([])
    const result = await scrapeWithFallback("standings")
    expect(result.source).toBe("api")
    expect(api.fetchStandings).toHaveBeenCalled()
  })

  it("usa la API cuando el HTML trae partidos sin hora (degradado)", async () => {
    vi.mocked(html.scrapeUpcomingHTML).mockResolvedValue([
      { local: "Cali", visitante: "Pasto", fecha: "2026-08-20", hora: "", jornada: 16 },
    ])
    vi.mocked(api.fetchUpcomingWeeks).mockResolvedValue([
      { local: "Cali", visitante: "Pasto", fecha: "2026-08-20", hora: "15:00", jornada: 16 },
    ])
    const result = await scrapeWithFallback("upcoming")
    expect(result.source).toBe("api")
    expect(result.data).toEqual([
      { local: "Cali", visitante: "Pasto", fecha: "2026-08-20", hora: "15:00", jornada: 16 },
    ])
    expect(result.warnings).toBeDefined()
  })

  it("usa el HTML degradado como último recurso si la API está vacía", async () => {
    vi.mocked(html.scrapeUpcomingHTML).mockResolvedValue([
      { local: "Cali", visitante: "Pasto", fecha: "2026-08-20", hora: "", jornada: 16 },
    ])
    vi.mocked(api.fetchUpcomingWeeks).mockResolvedValue([])
    const result = await scrapeWithFallback("upcoming")
    expect(result.source).toBe("html")
    expect(result.warnings).toBeDefined()
  })

  it("trata como degradado el HTML de matchdays sin fecha/hora", async () => {
    vi.mocked(html.scrapeAllMatchdaysHTML).mockResolvedValue([
      {
        jornada: 1,
        fecha: "2026-02-18",
        partidos: [
          { local: "Cali", visitante: "Pasto", fecha: "2026-02-18", hora: "" },
        ],
      },
    ])
    vi.mocked(api.fetchAllMatchdays).mockResolvedValue([
      {
        jornada: 1,
        fecha: "2026-02-18",
        partidos: [
          { local: "Cali", visitante: "Pasto", fecha: "2026-02-18", hora: "17:00" },
        ],
      },
    ])
    const result = await scrapeWithFallback("matches")
    expect(result.source).toBe("api")
  })
})

describe("applyScraperData", () => {
  it("enruta cada scraper al guardador correcto", async () => {
    const { supabase } = buildSupabaseMock({})

    await applyScraperData("standings", [], supabase)
    expect(save.saveStandingsToSupabase).toHaveBeenCalledWith([], supabase)

    await applyScraperData("results-html", [], supabase)
    expect(save.saveResultsToSupabase).toHaveBeenCalledWith([], supabase)

    await applyScraperData("matches", [], supabase)
    expect(save.saveMatchesToSupabase).toHaveBeenCalledWith([], supabase, "regular")

    await applyScraperData("upcoming", [], supabase)
    expect(save.saveUpcomingToSupabase).toHaveBeenCalledWith([], supabase)
  })
})

describe("buildScraperPreview standings", () => {
  it("genera diff update para equectores existentes y create para nuevos", async () => {
    const { supabase } = buildSupabaseMock({
      teams: [
        { id: "t1", name: "Cali", full_name: "Deportivo Cali", slug: "cali", city: null, shield_url: null },
      ],
      standings: [
        { team_id: "t1", pos: 1, pts: 10, pj: 5, pg: 5, pe: 0, pp: 0, gf: 9, gc: 1, dif: 8 },
      ],
    })

    const preview = await buildScraperPreview("standings", [
      { pos: 1, name: "Cali", pts: 30, pj: 8, pg: 7, pe: 1, pp: 0, gf: 14, gc: 2, dif: 12 },
      { pos: 2, name: "Nuevo", pts: 10, pj: 8, pg: 3, pe: 1, pp: 4, gf: 5, gc: 9, dif: -4 },
    ], supabase)

    const [first, second] = preview.diff
    expect(first.type).toBe("update")
    expect(second.type).toBe("create")
    expect(preview.summary.updates).toBe(1)
    expect(preview.summary.creates).toBe(1)
    expect(preview.warnings).toContainEqual(
      expect.stringContaining("Nuevo"),
    )
  })
})