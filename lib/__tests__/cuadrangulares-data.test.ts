import { describe, expect, it, vi, beforeEach } from "vitest"
import { createClient } from "@/lib/supabase/server"
import { getBracket } from "@/lib/liga/cuadrangulares-data"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

type Table = "seasons" | "matches" | "teams"

const idA1 = "a1"
const idA2 = "a2"
const idB1 = "b1"
const idB2 = "b2"

const teams = [
  { id: idA1, name: "Millonarios", slug: "millonarios", shield_url: null },
  { id: idA2, name: "Santa Fe", slug: "santa-fe", shield_url: null },
  { id: idB1, name: "Cali", slug: "cali", shield_url: null },
  { id: idB2, name: "América", slug: "america", shield_url: null },
]

const season = { id: "season-1", name: "2026" }

type MatchRow = {
  id: string
  phase: string
  tie_key: string | null
  leg: number | null
  jornada: number | null
  local_team_id: string
  away_team_id: string
  local_score: number | null
  away_score: number | null
  match_date: string | null
  match_time: string | null
  status: string | null
}

function match(row: Partial<MatchRow> & { id: string; local_team_id: string; away_team_id: string }): MatchRow {
  return {
    phase: "semifinal",
    tie_key: null,
    leg: null,
    jornada: null,
    local_score: null,
    away_score: null,
    match_date: null,
    match_time: null,
    status: "scheduled",
    ...row,
  }
}

function buildClient(tables: { matches?: unknown; seasons?: unknown; teams?: unknown }) {
  const data = {
    seasons: tables.seasons ?? [season],
    matches: tables.matches ?? [],
    teams: tables.teams ?? teams,
  }

  function makeQuery(table: Table) {
    const thenable = (value: unknown) => ({
      then: (resolve: (value: unknown) => unknown, reject: (reason?: unknown) => unknown) =>
        Promise.resolve(value).then(resolve as never, reject as never),
    })

    const query: Record<string, unknown> = {
      select: () => query,
      eq: () => query,
      in: () => query,
      order: () => query,
      maybeSingle: () => thenable({ data: data.seasons[0] ?? null, error: null }),
      then: (resolve: (value: unknown) => unknown, reject: (reason?: unknown) => unknown) =>
        Promise.resolve({ data: data[table], error: null }).then(resolve as never, reject as never),
    }

    return query
  }

  return {
    from: (table: Table) => makeQuery(table),
  }
}

beforeEach(() => {
  vi.mocked(createClient).mockReset()
})

function mockMatches(rows: MatchRow[]) {
  vi.mocked(createClient).mockReturnValue(buildClient({ matches: rows }) as never)
}

describe("getBracket", () => {
  it("devuelve estado vacío sin temporada activa", async () => {
    vi.mocked(createClient).mockReturnValue(buildClient({ seasons: [] }) as never)
    await expect(getBracket()).resolves.toEqual({
      season: null,
      seasonId: null,
      semifinals: [],
      final: null,
    })
  })

  it("arma la llave con un partido de semifinal provisional sin tie_key ni leg", async () => {
    mockMatches([
      match({ id: "m1", local_team_id: idA1, away_team_id: idA2 }),
    ])

    const bracket = await getBracket()
    expect(bracket.semifinals).toHaveLength(1)
    const tie = bracket.semifinals[0]
    expect(tie?.home.team?.name).toBe("Millonarios")
    expect(tie?.away.team?.name).toBe("Santa Fe")
    expect(tie?.legs).toHaveLength(1)
    expect(tie?.legs[0].id).toBe("m1")
    expect(tie?.aggregate).toBeNull()
  })

  it("sin leg ni tie_key, usa la jornada para ordenar ida (J1) antes de vuelta (J2)", async () => {
    mockMatches([
      match({
        id: "sf-j2",
        local_team_id: idA2,
        away_team_id: idA1,
        jornada: 2,
      }),
      match({
        id: "sf-j1",
        local_team_id: idA1,
        away_team_id: idA2,
        jornada: 1,
      }),
    ])

    const bracket = await getBracket()
    expect(bracket.semifinals).toHaveLength(1)
    const tie = bracket.semifinals[0]
    expect(tie?.legs).toHaveLength(2)
    expect(tie?.legs[0].id).toBe("sf-j1")
    expect(tie?.legs[1].id).toBe("sf-j2")
    expect(tie?.home.team?.name).toBe("Millonarios")
    expect(tie?.away.team?.name).toBe("Santa Fe")
  })

  it("empareja ida y vuelta sin tie_key por la dupla de equipos y ordena Ida antes de Vuelta", async () => {
    mockMatches([
      match({
        id: "sf1-vuelta",
        local_team_id: idA2,
        away_team_id: idA1,
        leg: 2,
        match_date: "2026-09-20",
        local_score: 1,
        away_score: 1,
      }),
      match({
        id: "sf2-vuelta",
        local_team_id: idB2,
        away_team_id: idB1,
        leg: 2,
        match_date: "2026-09-20",
      }),
      match({
        id: "sf2-ida",
        local_team_id: idB1,
        away_team_id: idB2,
        leg: 1,
        match_date: "2026-09-16",
        local_score: 2,
        away_score: 1,
      }),
      match({
        id: "sf1-ida",
        local_team_id: idA1,
        away_team_id: idA2,
        leg: 1,
        match_date: "2026-09-16",
        local_score: 3,
        away_score: 2,
      }),
    ])

    const bracket = await getBracket()
    expect(bracket.semifinals).toHaveLength(2)

    const [sf1, sf2] = bracket.semifinals
    expect(sf1?.home.team?.name).toBe("Millonarios")
    expect(sf1?.away.team?.name).toBe("Santa Fe")
    expect(sf1?.legs.map((l) => l.leg)).toEqual([1, 2])
    expect(sf1?.legs[0].id).toBe("sf1-ida")
    expect(sf1?.legs[1].id).toBe("sf1-vuelta")
    expect(sf1?.aggregate).toEqual({ home: 4, away: 3 })
    expect(sf1?.winnerTeamId).toBe(idA1)

    expect(sf2?.home.team?.name).toBe("Cali")
    expect(sf2?.away.team?.name).toBe("América")
    expect(sf2?.legs).toHaveLength(2)
    expect(sf2?.aggregate).toBeNull()
  })

  it("agrupa por tie_key cuando está presente", async () => {
    mockMatches([
      match({
        id: "s1a",
        tie_key: "semifinal-1",
        leg: 1,
        local_team_id: idA1,
        away_team_id: idA2,
      }),
      match({
        id: "s1b",
        tie_key: "semifinal-1",
        leg: 2,
        local_team_id: idA2,
        away_team_id: idA1,
      }),
      match({
        id: "s2a",
        tie_key: "semifinal-2",
        leg: 1,
        local_team_id: idB1,
        away_team_id: idB2,
      }),
    ])

    const bracket = await getBracket()
    expect(bracket.semifinals).toHaveLength(2)
    expect(bracket.semifinals[0]?.tieKey).toBe("semifinal-1")
    expect(bracket.semifinals[0]?.legs).toHaveLength(2)
    expect(bracket.semifinals[1]?.tieKey).toBe("semifinal-2")
    expect(bracket.semifinals[1]?.legs).toHaveLength(1)
    expect(bracket.semifinals[1]?.aggregate).toBeNull()
  })

  it("agrupa la final en una sola llave", async () => {
    mockMatches([
      match({
        id: "f1",
        phase: "final",
        tie_key: "final-1",
        leg: 1,
        local_team_id: idA1,
        away_team_id: idB1,
        local_score: 1,
        away_score: 1,
      }),
      match({
        id: "f2",
        phase: "final",
        tie_key: "final-1",
        leg: 2,
        local_team_id: idB1,
        away_team_id: idA1,
        local_score: 0,
        away_score: 2,
      }),
    ])

    const bracket = await getBracket()
    expect(bracket.final?.home.team?.name).toBe("Millonarios")
    expect(bracket.final?.legs).toHaveLength(2)
    expect(bracket.final?.aggregate).toEqual({ home: 3, away: 1 })
    expect(bracket.final?.winnerTeamId).toBe(idA1)
  })

  it("devuelve llaves vacías cuando no hay partidos de semifinal", async () => {
    mockMatches([])
    const bracket = await getBracket()
    expect(bracket.semifinals).toEqual([])
    expect(bracket.final).toBeNull()
  })
})