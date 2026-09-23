import * as cheerio from "cheerio"
import type { Standing, Matchday, Match, UpcomingMatch } from "./winsports-api"
import type { CuadrangularGroupMap } from "./cuadrangular-groups"

const BASE = "https://www.winsports.co"
const POSICIONES = `${BASE}/futbol-colombiano/liga-femenina/posiciones`
const RESULTADOS = `${BASE}/futbol-colombiano/liga-femenina/resultados`
const PARTIDOS = `${BASE}/futbol-colombiano/liga-femenina/partidos`

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

async function fetchHTML(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html" },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} desde ${url}`)
  return res.text()
}

function cleanName(raw: string): string {
  return raw.replace(/\s*Femenino\s*$/, "").trim()
}

const NAME_MAP: Record<string, string> = {
  "Atl. Nacional": "Atl. Nacional",
  "América": "América",
  "Inter Bogotá": "Inter de Bogotá",
  "Internacional de Bogotá": "Inter de Bogotá",
  "Inter Palmira": "Inter Palmira",
  "Medellín": "Medellín",
  "Bucaramanga": "Bucaramanga",
  "Once Caldas": "Once Caldas",
}

function mapStandingName(name: string): string {
  return NAME_MAP[name] ?? name
}

const TEAM_MAP_FIXTURES: Record<string, string> = {
  "Atlético Bucaramanga": "Bucaramanga",
  "Atlético Nacional": "Atl. Nacional",
  "América de Cali": "América",
  "Inter Bogotá": "Inter de Bogotá",
  "Deportivo Cali": "Cali",
  "Deportivo Pasto": "Pasto",
  "Independiente Medellín": "Medellín",
  "Independiente Santa Fe": "Santa Fe",
  "Inter Palmira": "Inter Palmira",
  "Internacional Palmira": "Inter Palmira",
  "Internacional de Bogotá": "Inter de Bogotá",
  "Real Santander": "Real Santander",
  "Once Caldas": "Once Caldas",
  "Junior": "Junior",
  "Llaneros": "Llaneros",
  "Fortaleza": "Fortaleza",
  "Orsomarso": "Orsomarso",
  "Millonarios": "Millonarios",
  "Santa Fe": "Santa Fe",
  "Cali": "Cali",
  "Pasto": "Pasto",
  "Santander": "Real Santander",
  "At. Nacional": "Atl. Nacional",
  "Bucaramanga": "Bucaramanga",
  "D. Cali": "Cali",
  "DIM": "Medellín",
}

function mapFixtureName(name: string): string {
  return TEAM_MAP_FIXTURES[name] ?? name
}

function parseStandingTable($: cheerio.CheerioAPI, table: cheerio.Cheerio<any>): Standing[] {
  const standings: Standing[] = []
  table.find("tbody tr").each((_, row) => {
    const tds = $(row).find("td")
    if (tds.length < 9) return
    const rawName = $(tds[0]).find("a").text().trim()
    const name = mapStandingName(rawName)
    if (!name) return
    const pts = parseInt($(tds[1]).text().trim(), 10)
    const pj = parseInt($(tds[2]).text().trim(), 10)
    const difRaw = $(tds[3]).text().trim()
    const pg = parseInt($(tds[4]).text().trim(), 10)
    const pe = parseInt($(tds[5]).text().trim(), 10)
    const pp = parseInt($(tds[6]).text().trim(), 10)
    const gf = parseInt($(tds[7]).text().trim(), 10)
    const gc = parseInt($(tds[8]).text().trim(), 10)
    const dif = parseInt(difRaw.replace(/[+\s]/g, ""), 10)
    standings.push({ pos: standings.length + 1, name, pts, pj, pg, pe, pp, gf, gc, dif: isNaN(dif) ? gf - gc : dif })
  })
  return standings
}

export async function scrapeStandingsHTML(): Promise<Standing[]> {
  const html = await fetchHTML(POSICIONES)
  const $ = cheerio.load(html)
  const sections = $("standings-competition")
  // Cuando Win cambia a la fase final, esta página deja de publicar
  // la clasificación general. No debemos guardar Grupo A como standings regular.
  if (sections.toArray().some((section) => /Grupo\s+[AB]/i.test($(section).text()))) return []
  return parseStandingTable($, sections.find("table.table").first())
}

export type StageStandings = { A: Standing[]; B: Standing[] }

export async function scrapeStageStandingsHTML(): Promise<StageStandings> {
  const html = await fetchHTML(POSICIONES)
  const $ = cheerio.load(html)
  const tables = $("standings-competition table.table")
  // Caso actual (ago 2026): 1 tabla con 9 <tr> (8 equipos + 1 separador vacío) y
  // cabecera con "Grupo A" / "Grupo B". El parser ya omite la fila vacía.
  // Caso alterno: 2 tablas (una por grupo). Soportamos ambos.
  const byTable = tables.toArray().map((table) => parseStandingTable($, $(table)))
  // Si hay 1 tabla con 8 filas, es el caso combinado; si hay 2 tablas con 4 cada una, también
  const flat = byTable.flat()
  if (flat.length !== 8) {
    // Intentamos detectar directamente por filas con grupo explícito si el conteo falla
    throw new Error(`Win publicó ${flat.length} filas de cuadrangulares; se esperaban 8`)
  }
  // Si vino en 2 tablas, asignamos por tabla; si vino en 1, por posición
  if (byTable.length === 2 && byTable[0].length === 4 && byTable[1].length === 4) {
    return {
      A: byTable[0].map((r, i) => ({ ...r, pos: i + 1 })),
      B: byTable[1].map((r, i) => ({ ...r, pos: i + 1 })),
    }
  }
  const A = flat.slice(0, 4).map((r, i) => ({ ...r, pos: i + 1 }))
  const B = flat.slice(4, 8).map((r, i) => ({ ...r, pos: i + 1 }))
  return { A, B }
}

interface MatchCard {
  jornada: number
  local: string
  visitante: string
  golesLocal?: number
  golesVisitante?: number
  fecha: string
  hora: string
  status: string
}

async function scrapeMatchCards(url: string): Promise<MatchCard[]> {
  const html = await fetchHTML(url)
  const $ = cheerio.load(html)

  const matches: MatchCard[] = []

  $('a[class*="match-"]').each((_, el) => {
    const header = $(el).find(".header").text().trim()
    const jornadaMatch = header.match(/Fecha\s*(\d+)/i)
    if (!jornadaMatch) return
    const jornada = parseInt(jornadaMatch[1], 10)

    const teams = $(el).find(".teams .team")
    if (teams.length < 2) return

    const localEl = $(teams[0])
    const visitanteEl = $(teams[1])

    const local = mapFixtureName(localEl.find(".name").text().trim())
    const visitante = mapFixtureName(visitanteEl.find(".name").text().trim())
    if (!local || !visitante) return

    const scoreText = localEl.find(".score").text().trim()
    const visitScoreText = visitanteEl.find(".score").text().trim()
    const golesLocal = scoreText ? parseInt(scoreText, 10) : undefined
    const golesVisitante = visitScoreText ? parseInt(visitScoreText, 10) : undefined

    const status = $(el).find(".status-text").text().trim().toLowerCase()

    const dateEl = $(el).find("format-date")
    const dateAttr =
      dateEl.attr(":date") ?? dateEl.attr("v-bind:date") ?? dateEl.attr("date")
    let fecha = ""
    let hora = ""
    if (dateAttr) {
      const d = new Date(parseInt(dateAttr, 10))
      if (!isNaN(d.getTime())) {
        fecha = d.toISOString().split("T")[0]
        hora = d.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Bogota",
          hour12: false,
        })
      }
    }

    matches.push({ jornada, local, visitante, golesLocal, golesVisitante, fecha, hora, status })
  })

  return matches
}

export async function scrapeResultsHTML(): Promise<Matchday[]> {
  const cards = await scrapeMatchCards(RESULTADOS)
  const grouped = new Map<number, Matchday>()

  for (const m of cards) {
    if (m.golesLocal == null || m.golesVisitante == null) continue

    if (!grouped.has(m.jornada)) {
      grouped.set(m.jornada, { jornada: m.jornada, fecha: m.fecha, partidos: [] })
    }

    grouped.get(m.jornada)!.partidos.push({
      local: m.local,
      visitante: m.visitante,
      fecha: m.fecha || undefined,
      hora: m.hora,
      golesLocal: m.golesLocal,
      golesVisitante: m.golesVisitante,
    })
  }

  return Array.from(grouped.values())
}

export async function scrapeUpcomingHTML(): Promise<UpcomingMatch[]> {
  const cards = await scrapeMatchCards(PARTIDOS)
  return cards
    .filter((m) => m.golesLocal == null)
    .map((m) => ({
      local: m.local,
      visitante: m.visitante,
      fecha: m.fecha,
      hora: m.hora,
      jornada: m.jornada,
    }))
}

export async function scrapeAllMatchdaysHTML(): Promise<Matchday[]> {
  const cards = await scrapeMatchCards(RESULTADOS)
  const grouped = new Map<number, Matchday>()

  for (const m of cards) {
    if (!grouped.has(m.jornada)) {
      grouped.set(m.jornada, { jornada: m.jornada, fecha: m.fecha, partidos: [] })
    }

    grouped.get(m.jornada)!.partidos.push({
      local: m.local,
      visitante: m.visitante,
      fecha: m.fecha || undefined,
      hora: m.hora,
      golesLocal: m.golesLocal,
      golesVisitante: m.golesVisitante,
    })
  }

  return Array.from(grouped.values())
}

export type CuadrangularFixture = UpcomingMatch & {
  group_name: "A" | "B"
  golesLocal?: number
  golesVisitante?: number
  matchStatus?: string
}

export async function scrapeCuadrangularMatchesHTML(
  groups: CuadrangularGroupMap,
): Promise<CuadrangularFixture[]> {
  // Mientras Win no publique fixtures en /partidos, esta función retorna [].
  // Cuando Win migre /partidos a <matches-competition> con el stage cuadrangular,
  // el scraper reutiliza scrapeMatchCards y enriquece con group_name.
  const cards = await scrapeMatchCards(PARTIDOS)
  if (cards.length === 0) return []
  const fixtures: CuadrangularFixture[] = []
  for (const m of cards) {
    const localGroup = groups[m.local]
    const group =
      localGroup && localGroup === groups[m.visitante] ? localGroup : null
    if (!group) {
      console.warn(
        `Cuadrangular HTML: partido sin grupo clasificable (${m.local} vs ${m.visitante}); se omite`,
      )
      continue
    }
    fixtures.push({
      local: m.local,
      visitante: m.visitante,
      fecha: m.fecha,
      hora: m.hora,
      jornada: m.jornada,
      group_name: group,
      golesLocal: m.golesLocal,
      golesVisitante: m.golesVisitante,
      matchStatus: m.status,
    })
  }
  return fixtures
}