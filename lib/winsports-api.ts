const API_BASE = "https://www.winsports.co/api/matches/competition"
const STANDINGS_API = "https://www.winsports.co/api/standings"
const STAGE_ID = "85b4l7dazn8mc4fivur3lkb2s"
export const CUADRANGULAR_STAGE_ID = "84n6bl7fg3hut5al91qnc9ams"

const TEAM_NAME_MAP: Record<string, string> = {
  "Inter Bogotá": "Inter de Bogotá",
  "Internacional Palmira": "Inter Palmira",
  "Internacional de Bogotá": "Inter de Bogotá",
  "Independiente Santa Fe": "Santa Fe",
  "Deportivo Cali": "Cali",
  "Independiente Medellín": "Medellín",
  "América de Cali": "América",
  "Atlético Nacional": "Atl. Nacional",
  "Deportivo Pasto": "Pasto",
  "Atlético Bucaramanga": "Bucaramanga",
}

export function mapTeam(name: string): string {
  return TEAM_NAME_MAP[name] ?? name
}

export function parseDate(iso: string) {
  const d = new Date(iso)
  const fecha = d.toISOString().split("T")[0]
  const hora = d.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
    hour12: false,
  })
  return { fecha, hora }
}

interface OptaMatch {
  id: string
  home: { name: string; scores: { ft: number | null } }
  away: { name: string; scores: { ft: number | null } }
  date: string
  header: string
  matchStatus: string
}

interface WeekResponse {
  matches: OptaMatch[]
  weeks: number[]
}

async function fetchWeek(
  week: number,
  isFuture: boolean,
  stageId: string = STAGE_ID,
): Promise<WeekResponse> {
  const url = `${API_BASE}?stageId=${stageId}&week=${week}&isFuture=${isFuture}`
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })
  if (!res.ok) return { matches: [], weeks: [] }
  return res.json()
}

export async function fetchCuadrangularWeek(
  week: number,
  isFuture: boolean,
): Promise<WeekResponse> {
  return fetchWeek(week, isFuture, CUADRANGULAR_STAGE_ID)
}

export interface Standing {
  pos: number
  name: string
  pts: number
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  dif: number
}

export interface Match {
  local: string
  visitante: string
  fecha?: string
  hora: string
  golesLocal?: number
  golesVisitante?: number
  matchStatus?: string
}

export interface Matchday {
  jornada: number
  fecha: string
  partidos: Match[]
}

export interface UpcomingMatch {
  local: string
  visitante: string
  fecha: string
  hora: string
  jornada: number
}

function mapRankingEntry(r: {
  rank: number
  contestantShortName: string
  points: number
  matchesPlayed: number
  matchesWon: number
  matchesDrawn: number
  matchesLost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: string | number
}): Standing {
  return {
    pos: r.rank,
    name: mapTeam(r.contestantShortName),
    pts: r.points,
    pj: r.matchesPlayed,
    pg: r.matchesWon,
    pe: r.matchesDrawn,
    pp: r.matchesLost,
    gf: r.goalsFor,
    gc: r.goalsAgainst,
    dif:
      typeof r.goalDifference === "string"
        ? parseInt(r.goalDifference.replace(/[+\s]/g, ""), 10)
        : r.goalDifference,
  }
}

export async function fetchStandings(stageId: string = STAGE_ID): Promise<Standing[]> {
  const res = await fetch(`${STANDINGS_API}?stageId=${stageId}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} desde API standings`)
  const data = await res.json()
  const ranking = data.standings?.[0]?.ranking ?? []
  return ranking.map(mapRankingEntry)
}

export type StageStandings = { A: Standing[]; B: Standing[] }

export async function fetchStageStandings(
  stageId: string = CUADRANGULAR_STAGE_ID,
): Promise<StageStandings> {
  const res = await fetch(`${STANDINGS_API}?stageId=${stageId}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} desde API stage standings`)
  const data = await res.json()
  const standings: Array<{ groupName: string | null; ranking: typeof data.standings[0]["ranking"] }> =
    data.standings ?? []
  const groupA = standings.find((group) => /^grupo\s*A$/i.test(group.groupName ?? ""))
  const groupB = standings.find((group) => /^grupo\s*B$/i.test(group.groupName ?? ""))
  const A = (groupA?.ranking ?? []).map(mapRankingEntry)
  const B = (groupB?.ranking ?? []).map(mapRankingEntry)
  if (A.length === 4 && B.length === 4) return { A, B }
  // Algunas respuestas publican un único ranking plano de 8 equipos.
  if (!groupA && !groupB) {
    const flat = standings.flatMap((group) => (group.ranking ?? []).map(mapRankingEntry))
    if (flat.length === 8) return { A: flat.slice(0, 4), B: flat.slice(4, 8) }
  }
  if (A.length !== 4 || B.length !== 4) {
    throw new Error(`API cuadrangular devolvió A=${A.length}, B=${B.length}; se esperaban 4+4`)
  }
  return { A, B }
}

export function extractJornada(header: string): number | null {
  const m = header.match(/Fecha\s*(\d+)/i)
  return m ? parseInt(m[1], 10) : null
}

async function discoverWeeks(stageId: string = STAGE_ID): Promise<{
  past: number[]
  future: number[]
}> {
  const past = await fetchWeek(1, false, stageId)
  const pastWeeks = past.weeks ?? []

  let futureWeeks: number[] = []
  const guesses = stageId === CUADRANGULAR_STAGE_ID ? [1, 2, 6, 3] : [14, 15, 16, 17, 18]
  for (const guess of guesses) {
    const f = await fetchWeek(guess, true, stageId)
    if (f.weeks?.length) {
      futureWeeks = f.weeks
      break
    }
  }

  return { past: pastWeeks, future: futureWeeks }
}

export async function fetchAllMatchdays(stageId: string = STAGE_ID): Promise<Matchday[]> {
  const { past, future } = await discoverWeeks(stageId)
  const allWeeks = [...new Set([...past, ...future])].sort(
    (a, b) => a - b,
  )
  if (allWeeks.length === 0) return []

  const jornadaMap = new Map<number, Matchday>()

  for (const week of allWeeks) {
    const [pastData, futureData] = await Promise.all([
      fetchWeek(week, false, stageId),
      fetchWeek(week, true, stageId),
    ])
    const matchesById = new Map(
      [...pastData.matches, ...futureData.matches].map((match) => [match.id, match]),
    )
    const matches = [...matchesById.values()]

    const partidos: Match[] = matches.map((m) => {
      const { fecha, hora } = parseDate(m.date)
      return {
        local: mapTeam(m.home.name),
        visitante: mapTeam(m.away.name),
        fecha,
        hora,
        golesLocal: m.home.scores?.ft ?? undefined,
        golesVisitante: m.away.scores?.ft ?? undefined,
        matchStatus: m.matchStatus,
      }
    })

    const firstDate = partidos[0]?.fecha ?? ""
    jornadaMap.set(week, { jornada: week, fecha: firstDate, partidos })

    await new Promise((r) => setTimeout(r, 200))
  }

  return Array.from(jornadaMap.values())
}

export async function fetchCuadrangularMatchdays(): Promise<Matchday[]> {
  return fetchAllMatchdays(CUADRANGULAR_STAGE_ID)
}

export async function fetchUpcomingWeeks(stageId: string = STAGE_ID): Promise<UpcomingMatch[]> {
  const { future } = await discoverWeeks(stageId)

  if (future.length === 0) return []

  const matches: UpcomingMatch[] = []

  for (const week of future) {
    const data = await fetchWeek(week, true, stageId)
    for (const m of data.matches) {
      const { fecha, hora } = parseDate(m.date)
      matches.push({
        local: mapTeam(m.home.name),
        visitante: mapTeam(m.away.name),
        fecha,
        hora,
        jornada: week,
      })
    }
    await new Promise((r) => setTimeout(r, 200))
  }

  return matches
}

export async function fetchCuadrangularUpcoming(): Promise<UpcomingMatch[]> {
  return fetchUpcomingWeeks(CUADRANGULAR_STAGE_ID)
}
