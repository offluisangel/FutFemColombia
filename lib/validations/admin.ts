import { z } from "zod"

const emptyToNull = (value: unknown) => value === "" ? null : value

export const teamSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  full_name: z.string().trim().min(1, "El nombre completo es obligatorio"),
  slug: z.string()
    .trim()
    .min(1, "El slug es obligatorio")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug debe usar minúsculas, números y guiones"),
  city: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  shield_url: z.preprocess(
    emptyToNull,
    z.string().trim().url("El escudo debe ser una URL válida").nullable().optional(),
  ),
})

export const seasonSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  is_active: z.boolean().default(false),
})

export const scorerSchema = z.object({
  season_id: z.string().uuid("Temporada inválida"),
  player_id: z.coerce.number().int().positive("El ID de jugadora debe ser mayor a cero"),
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  team_id: z.preprocess(emptyToNull, z.string().uuid("Equipo inválido").nullable().optional()),
  team_name: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  goals: z.coerce.number().int().min(0, "Los goles no pueden ser negativos"),
  pos: z.coerce.number().int().min(0, "La posición no puede ser negativa"),
})

export const matchSchema = z.object({
  season_id: z.string().uuid("Temporada inválida"),
  jornada: z.coerce.number().int().positive("La jornada debe ser mayor a cero"),
  phase: z.string().trim().min(1, "La fase es obligatoria"),
  group_name: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  leg: z.preprocess(emptyToNull, z.coerce.number().int().positive().nullable().optional()),
  tie_key: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  local_team_id: z.string().uuid("Equipo local inválido"),
  away_team_id: z.string().uuid("Equipo visitante inválido"),
  local_score: z.preprocess(emptyToNull, z.coerce.number().int().min(0).nullable().optional()),
  away_score: z.preprocess(emptyToNull, z.coerce.number().int().min(0).nullable().optional()),
  match_date: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  match_time: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  status: z.enum(["scheduled", "played"]),
}).superRefine((data, ctx) => {
  if (data.local_team_id === data.away_team_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["away_team_id"],
      message: "El local y el visitante no pueden ser el mismo equipo",
    })
  }

  if (data.status === "played" && (data.local_score == null || data.away_score == null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["local_score"],
      message: "Los partidos jugados necesitan marcador completo",
    })
  }
})

export const bulkMatchSchema = z.object({
  bulk: z.literal(true),
  season_id: z.string().uuid("Temporada inválida"),
  jornada: z.coerce.number().int().positive("La jornada debe ser mayor a cero"),
  phase: z.string().trim().min(1, "La fase es obligatoria"),
  group_name: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  status: z.enum(["scheduled", "played"]),
  clear_scores: z.boolean().default(false),
})

export const stageStandingsSchema = z.object({
  season_id: z.string().uuid("Temporada inválida"),
  stage: z.string().trim().min(1, "La fase es obligatoria"),
  group_name: z.enum(["A", "B"]),
  rows: z.array(z.object({
    team_id: z.string().uuid("Equipo inválido"),
    pos: z.coerce.number().int().positive(),
    pts: z.coerce.number().int().min(0),
    pj: z.coerce.number().int().min(0),
    pg: z.coerce.number().int().min(0),
    pe: z.coerce.number().int().min(0),
    pp: z.coerce.number().int().min(0),
    gf: z.coerce.number().int().min(0),
    gc: z.coerce.number().int().min(0),
    dif: z.coerce.number().int(),
  })).min(1, "Debe incluir al menos un equipo"),
})

export function validationError(error: z.ZodError) {
  return {
    error: {
      code: "VALIDATION_ERROR",
      message: error.issues[0]?.message ?? "Datos inválidos",
      details: error.flatten(),
    },
  }
}
