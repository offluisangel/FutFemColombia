import { afterEach, describe, expect, it, vi } from "vitest"
import {
  fetchStandings,
  fetchAllMatchdays,
  fetchUpcomingWeeks,
  mapTeam,
  parseDate,
  extractJornada,
} from "@/lib/winsports-api"

type MockRoute = { match: string; payload: unknown }

function mockFetchRoutes(routes: MockRoute[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const route = routes.find((r) => url.includes(r.match))
      if (!route) return { ok: false, status: 404, json: async () => ({}) }
      return { ok: true, status: 200, json: async () => route.payload }
    }) as unknown as typeof fetch,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("helpers", () => {
  it("mapTeam traduce nombres largos y deja desconocidos igual", () => {
    expect(mapTeam("Deportivo Cali")).toBe("Cali")
    expect(mapTeam("Independiente Santa Fe")).toBe("Santa Fe")
    expect(mapTeam("Inter Bogotá")).toBe("Inter de Bogotá")
    expect(mapTeam("Equipo Nuevo")).toBe("Equipo Nuevo")
  })

  it("parseDate separa fecha y hora en zona de Bogotá", () => {
    const { fecha, hora } = parseDate("2026-02-18T22:00:00+00:00")
    expect(fecha).toBe("2026-02-18")
    expect(hora).toMatch(/^\d{2}:\d{2}$/)
  })

  it("extractJornada lee el número de la fecha", () => {
    expect(extractJornada("Fecha 12")).toBe(12)
    expect(extractJornada("Fecha 4 - Fase Final")).toBe(4)
    expect(extractJornada("Ronda")).toBeNull()
    expect(extractJornada("")).toBeNull()
  })
})

describe("fetchStandings", () => {
  it("mapea nombres y normaliza la diferencia de gol", async () => {
    mockFetchRoutes([
      {
        match: "/api/standings",
        payload: {
          standings: [
            {
              ranking: [
                {
                  rank: 1,
                  contestantShortName: "Independiente Santa Fe",
                  points: 13,
                  matchesPlayed: 5,
                  matchesWon: 4,
                  matchesDrawn: 1,
                  matchesLost: 0,
                  goalsFor: 10,
                  goalsAgainst: 2,
                  goalDifference: "+8",
                },
                {
                  rank: 2,
                  contestantShortName: "Deportivo Cali",
                  points: 9,
                  matchesPlayed: 5,
                  matchesWon: 3,
                  matchesDrawn: 0,
                  matchesLost: 2,
                  goalsFor: 5,
                  goalsAgainst: 4,
                  goalDifference: "1",
                },
              ],
            },
          ],
        },
      },
    ])

    const standings = await fetchStandings()
    expect(standings).toHaveLength(2)
    expect(standings[0]).toMatchObject({
      pos: 1,
      name: "Santa Fe",
      pts: 13,
      dif: 8,
    })
    expect(standings[1]).toMatchObject({ name: "Cali", dif: 1 })
  })

  it("lanza error si la API responde con status no-ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch,
    )
    await expect(fetchStandings()).rejects.toThrow("HTTP 500")
  })
})

describe("fetchAllMatchdays", () => {
  const match = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: "m1",
    home: { name: "Deportivo Cali", scores: { ft: 2 } },
    away: { name: "Llaneros", scores: { ft: 1 } },
    date: "2026-02-18T22:00:00+00:00",
    header: "Fecha 1",
    matchStatus: "",
    ...overrides,
  })

  it("agrupa por jornada ordenada y mapea scores", async () => {
    mockFetchRoutes([
      {
        match: "week=1&isFuture=false",
        payload: { matches: [match()], weeks: [1, 2] },
      },
      {
        match: "week=2&isFuture=false",
        payload: { matches: [match({ header: "Fecha 2" })], weeks: [] },
      },
    ])

    const matchdays = await fetchAllMatchdays()
    expect(matchdays.map((m) => m.jornada)).toEqual([1, 2])
    expect(matchdays[0].partidos[0]).toMatchObject({
      local: "Cali",
      visitante: "Llaneros",
      golesLocal: 2,
      golesVisitante: 1,
    })
  })

  it("cae a isFuture=true cuando la jornada no trae partidos jugados", async () => {
    // week 1 false: descubrimiento de semanas (past) sin partidos para la semana actual
    mockFetchRoutes([
      {
        match: "week=1&isFuture=false",
        payload: { matches: [], weeks: [1] },
      },
      {
        match: "week=1&isFuture=true",
        payload: {
          matches: [
            {
              ...match(),
              home: { name: "Pasto", scores: { ft: null } },
              away: { name: "Cali", scores: { ft: null } },
            },
          ],
          weeks: [],
        },
      },
    ])

    const matchdays = await fetchAllMatchdays()
    expect(matchdays).toHaveLength(1)
    expect(matchdays[0].partidos[0]).toMatchObject({
      local: "Pasto",
      visitante: "Cali",
      golesLocal: undefined,
      golesVisitante: undefined,
    })
  })

  it("devuelve [] cuando no hay semanas descubiertas", async () => {
    mockFetchRoutes([
      { match: "week=1&isFuture=false", payload: { matches: [], weeks: [] } },
    ])
    await expect(fetchAllMatchdays()).resolves.toEqual([])
  })
})

describe("fetchUpcomingWeeks", () => {
  it("listas próximos partidos con su jornada", async () => {
    mockFetchRoutes([
      {
        match: "week=14&isFuture=true",
        payload: {
          matches: [
            {
              id: "u1",
              home: { name: "América de Cali", scores: { ft: null } },
              away: { name: "Pasto", scores: { ft: null } },
              date: "2026-03-01T20:00:00+00:00",
              header: "Fecha 14",
              matchStatus: "",
            },
          ],
          weeks: [14, 15],
        },
      },
      {
        match: "week=15&isFuture=true",
        payload: { matches: [], weeks: [14, 15] },
      },
    ])

    const upcoming = await fetchUpcomingWeeks()
    expect(upcoming).toHaveLength(1)
    expect(upcoming[0]).toMatchObject({
      local: "América",
      visitante: "Pasto",
      jornada: 14,
    })
  })

  it("devuelve [] cuando no hay semanas futuras", async () => {
    mockFetchRoutes([
      { match: "week=14&isFuture=true", payload: { matches: [], weeks: [] } },
      { match: "week=15&isFuture=true", payload: { matches: [], weeks: [] } },
      { match: "week=16&isFuture=true", payload: { matches: [], weeks: [] } },
      { match: "week=17&isFuture=true", payload: { matches: [], weeks: [] } },
      { match: "week=18&isFuture=true", payload: { matches: [], weeks: [] } },
    ])
    await expect(fetchUpcomingWeeks()).resolves.toEqual([])
  })
})