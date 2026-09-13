import { describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  saveStandingsToSupabase,
  saveMatchesToSupabase,
  saveUpcomingToSupabase,
  saveCuadrangularFixturesToSupabase,
  mergeFields,
} from "@/lib/save-to-supabase"

type Row = Record<string, unknown>
type AnyFn = (...args: unknown[]) => unknown

function buildSupabaseMock(initial: {
  teams?: Row[]
  seasons?: Row[]
  matches?: Row[]
}) {
  const upserts: Array<{ table: string; rows: Row[] }> = []
  const tables: Record<string, Row[]> = {
    teams: initial.teams ?? [],
    seasons: initial.seasons ?? [],
    matches: initial.matches ?? [],
    standings: [],
  }

  const root: any = {}
  let filters: Row = {}
  let upsertArgs: { rows: Row[] } | null = null
  let currentTable = ""

  const thenable = (v: unknown) => {
    const o: any = {}
    o.then = (res: AnyFn, rej: AnyFn) => Promise.resolve(v).then(res, rej)
    return o
  }

  const q: any = {
    select: () => q,
    eq: (k: string, v: unknown) => {
      filters = { ...filters, [k]: v }
      return q
    },
    upsert: (rows: Row[]) => {
      upsertArgs = { rows }
      return q
    },
    single: () =>
      thenable({ data: tables[currentTable]?.[0] ?? null, error: null }),
    maybeSingle: () =>
      thenable({ data: tables[currentTable]?.[0] ?? null, error: null }),
    then: (res: AnyFn, rej: AnyFn) =>
      Promise.resolve(resolveQuery()).then(res, rej),
  }

  function resolveQuery() {
    if (upsertArgs) {
      const table = currentTable
      const rows = upsertArgs.rows.map((r, i) => ({
        id: `id-${table}-${(r as Row).slug ?? i}`,
        ...r,
      }))
      tables[table] = [...(tables[table] ?? []), ...rows]
      upserts.push({ table, rows })
      upsertArgs = null
      return { data: rows, error: null }
    }

    let data = tables[currentTable] ?? []
    if (filters.season_id) {
      data = data.filter((r) => r.season_id === filters.season_id)
    }
    filters = {}
    return { data, error: null }
  }

  void q

  return {
    supabase: {
      from: (table: string) => {
        currentTable = table
        upsertArgs = null
        filters = {}
        return q
      },
    } as unknown as SupabaseClient,
    upserts,
  }
}

describe("mergeFields", () => {
  it("conserva valores existentes cuando el incoming es null", () => {
    const merged = mergeFields(
      { local_score: 3, away_score: 1, match_date: "2026-01-01" } as Row,
      { local_score: null, away_score: 1, match_date: null } as Row,
    )
    expect(merged.local_score).toBe(3)
    expect(merged.match_date).toBe("2026-01-01")
    expect(merged.away_score).toBe(1)
  })

  it("devuelve incoming tal cual si no hay existente", () => {
    const incoming = { local_score: 2, away_score: 0 } as Row
    expect(mergeFields(undefined, incoming)).toBe(incoming)
  })
})

describe("saveStandingsToSupabase", () => {
  it("hace upsert de teams y mapea results a team_id", async () => {
    const { supabase, upserts } = buildSupabaseMock({ teams: [] })

    await saveStandingsToSupabase(
      [{ pos: 1, name: "Cali", pts: 15, pj: 8, pg: 5, pe: 2, pp: 1, gf: 20, gc: 8, dif: 12 }],
      supabase,
    )

    const teamUpsert = upserts.find((u) => u.table === "teams")
    expect(teamUpsert?.rows[0]).toMatchObject({ name: "Cali", slug: "cali" })

    const standingsUpsert = upserts.find((u) => u.table === "standings")
    expect(standingsUpsert?.rows[0]).toMatchObject({
      team_id: "id-teams-cali",
      pos: 1,
      dif: 12,
    })
  })
})

describe("saveUpcomingToSupabase", () => {
  it("crear upcoming con status scheduled y conserva marcador existente", async () => {
    const { supabase, upserts } = buildSupabaseMock({
      teams: [
        { id: "c", name: "Cali" },
        { id: "p", name: "Pasto" },
      ],
      seasons: [{ id: "s1", is_active: true }],
      matches: [
        {
          id: "existing",
          season_id: "s1",
          jornada: 2,
          local_team_id: "c",
          away_team_id: "p",
          local_score: 3,
          away_score: 1,
        },
      ],
    })

    await saveUpcomingToSupabase(
      [
        {
          local: "Cali",
          visitante: "Pasto",
          fecha: "2026-03-01",
          hora: "20:00",
          jornada: 2,
        },
      ],
      supabase,
    )

    const matchUpsert = upserts.find((u) => u.table === "matches")
    expect(matchUpsert?.rows).toHaveLength(1)
    expect(matchUpsert?.rows[0]).toMatchObject({
      season_id: "s1",
      status: "scheduled",
      local_score: 3, // preservado del existente
      away_score: 1,
    })
  })
})

describe("saveMatchesToSupabase", () => {
  it("marca como played cuando hay goles", async () => {
    const { supabase, upserts } = buildSupabaseMock({
      teams: [
        { id: "c", name: "Cali" },
        { id: "l", name: "Llaneros" },
      ],
      seasons: [{ id: "s1", is_active: true }],
      matches: [],
    })

    await saveMatchesToSupabase(
      [
        {
          jornada: 1,
          fecha: "2026-02-18",
          partidos: [
            { local: "Cali", visitante: "Llaneros", hora: "17:00", golesLocal: 2, golesVisitante: 1 },
          ],
        },
      ],
      supabase,
      "regular",
    )

    const matchUpsert = upserts.find((u) => u.table === "matches")
    expect(matchUpsert?.rows[0]).toMatchObject({
      jornada: 1,
      phase: "regular",
      local_score: 2,
      away_score: 1,
      status: "played",
    })
  })
})

describe("saveCuadrangularFixturesToSupabase", () => {
  it("guarda un finalizado y no cuenta un partido en vivo como jugado", async () => {
    const { supabase, upserts } = buildSupabaseMock({
      teams: [
        { id: "m", name: "Millonarios" },
        { id: "i", name: "Inter de Bogotá" },
        { id: "p", name: "Inter Palmira" },
        { id: "n", name: "Atl. Nacional" },
      ],
      seasons: [{ id: "s1", is_active: true }],
      matches: [],
    })

    await saveCuadrangularFixturesToSupabase([
      { local: "Millonarios", visitante: "Inter de Bogotá", fecha: "2026-08-24", hora: "15:00", jornada: 1, group_name: "A", golesLocal: 0, golesVisitante: 1, matchStatus: "Finalizado" },
      { local: "Inter Palmira", visitante: "Atl. Nacional", fecha: "2026-08-24", hora: "17:00", jornada: 1, group_name: "A", golesLocal: 1, golesVisitante: 0, matchStatus: "En Vivo" },
    ], supabase)

    const rows = upserts.find((u) => u.table === "matches")?.rows
    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ local_score: 0, away_score: 1, status: "played" }),
      expect.objectContaining({ local_score: 1, away_score: 0, status: "live" }),
    ]))
  })
})