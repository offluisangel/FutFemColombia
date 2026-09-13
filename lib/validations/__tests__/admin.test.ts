import { describe, expect, it } from "vitest"
import { teamSchema, seasonSchema, matchSchema, validationError } from "@/lib/validations/admin"

describe("teamSchema", () => {
  it("valida un equipo correcto", () => {
    const res = teamSchema.safeParse({
      name: "Cali",
      full_name: "Deportivo Cali",
      slug: "deportivo-cali",
      city: "",
      shield_url: "",
    })
    expect(res.success).toBe(true)
    expect(res.data).toMatchObject({ city: null, shield_url: null })
  })

  it("rechaza nombre vacío y slug inválido", () => {
    expect(
      teamSchema.safeParse({ name: "", full_name: "Cali", slug: "CalI" }).success,
    ).toBe(false)
  })

  it("rechaza una URL inválida para el escudo", () => {
    expect(
      teamSchema.safeParse({
        name: "Cali",
        full_name: "Deportivo Cali",
        slug: "cali",
        shield_url: "no-es-url",
      }).success,
    ).toBe(false)
  })
})

describe("seasonSchema", () => {
  it("requiere nombre y defaultis_active en false", () => {
    const ok = seasonSchema.safeParse({ name: "2026" })
    expect(ok.success).toBe(true)
    expect(ok.data?.is_active).toBe(false)
    expect(seasonSchema.safeParse({ name: "" }).success).toBe(false)
  })
})

describe("matchSchema", () => {
  const base = {
    season_id: "00000000-0000-0000-0000-000000000001",
    jornada: 1,
    phase: "regular",
    local_team_id: "00000000-0000-0000-0000-000000000002",
    away_team_id: "00000000-0000-0000-0000-000000000003",
    status: "scheduled",
  }

  it("acepta un partido programado sin marcador", () => {
    expect(matchSchema.safeParse(base).success).toBe(true)
  })

  it("exige marcador completo si está jugado", () => {
    expect(matchSchema.safeParse({ ...base, status: "played" }).success).toBe(false)
    expect(
      matchSchema.safeParse({
        ...base,
        status: "played",
        local_score: 2,
        away_score: 1,
      }).success,
    ).toBe(true)
  })

  it("rechaza local igual al visitante", () => {
    const res = matchSchema.safeParse({
      ...base,
      away_team_id: base.local_team_id,
    })
    expect(res.success).toBe(false)
  })

  it("rechaza UUIDs inválidos", () => {
    expect(
      matchSchema.safeParse({ ...base, season_id: "no-uuid" }).success,
    ).toBe(false)
  })
})

describe("validationError", () => {
  it("aplica error de validación", () => {
    const zerr = matchSchema.safeParse({
      season_id: "bad",
      jornada: 1,
      phase: "x",
      local_team_id: "bad",
      away_team_id: "bad",
      status: "scheduled",
    })
    if (!zerr.success) {
      const out = validationError(zerr.error)
      expect(out.error.code).toBe("VALIDATION_ERROR")
      expect(out.error.message).toBeTruthy()
    }
  })
})