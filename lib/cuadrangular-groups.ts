import { fetchStageStandings, type StageStandings } from "@/lib/winsports-api"

export type CuadrangularGroup = "A" | "B"
export type CuadrangularGroupMap = Record<string, CuadrangularGroup>

/**
 * Construye el map equipo -> grupo a partir de las standings de la fase.
 * Es la fuente de verdad: los 8 equipos cambian cada temporada y la fuente
 * (API/HTML de Win Sports) ya publica grupo por equipo.
 */
export function mapFromStageStandings(standings: StageStandings): CuadrangularGroupMap {
  const map: CuadrangularGroupMap = {}
  for (const group of ["A", "B"] as const) {
    for (const team of standings[group]) {
      map[team.name] = group
    }
  }
  return map
}

/**
 * Un partido de cuadrangulares SIEMPRE es intra-grupo. Solo clasifica cuando
 * ambos equipos están en el map y comparten grupo; cualquier otra combinación
 * (equipo desconocido o cruce A-B) devuelve null para que el caller lo omita.
 */
export function inferCuadrangularGroup(
  groups: CuadrangularGroupMap,
  local: string,
  visitante: string,
): CuadrangularGroup | null {
  const localGroup = groups[local]
  const awayGroup = groups[visitante]
  return localGroup && localGroup === awayGroup ? localGroup : null
}

/**
 * Trae el map dinámico: API de standings primero, /posiciones HTML como
 * respaldo. Si ambas fuentes fallan, propaga el error: mejor un run fallido
 * y visible que guardar fixtures sin clasificar.
 */
export async function fetchCuadrangularGroupMap(): Promise<CuadrangularGroupMap> {
  let apiError: unknown
  try {
    return mapFromStageStandings(await fetchStageStandings())
  } catch (error) {
    apiError = error
  }
  // Import dinámico: evita el ciclo estático winsports-html -> cuadrangular-groups.
  try {
    const { scrapeStageStandingsHTML } = await import("@/lib/winsports-html")
    return mapFromStageStandings(await scrapeStageStandingsHTML())
  } catch {
    throw apiError
  }
}