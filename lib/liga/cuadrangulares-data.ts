import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

type Row = {
  team_id: string
  pos: number
  pts: number
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  dif: number
  group_name: "A" | "B"
  team: Team | null
  updated_at?: string | null
}

type Team = {
  id: string
  name: string
  slug: string
  shield_url: string | null
}

type Match = {
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
  group_name: string | null
}

async function getActiveSeason(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("seasons")
    .select("id, name")
    .eq("is_active", true)
    .maybeSingle()
  return data ?? null
}

const emptyGroups = () => ({ A: [] as Row[], B: [] as Row[] })

export async function getStageStandings() {
  const supabase = await createClient()
  const season = await getActiveSeason(supabase)
  if (!season) return { season: null, seasonId: null, groups: emptyGroups(), matches: [], updatedAt: null }

  const [standingsRes, teamsRes, matchesRes] = await Promise.all([
    supabase.from("stage_standings").select("*").eq("season_id", season.id).eq("stage", "cuadrangular").order("pos"),
    supabase.from("teams").select("id, name, slug, shield_url"),
    supabase.from("matches").select("id, group_name, local_team_id, away_team_id, local_score, away_score, status, match_date, match_time, jornada").eq("season_id", season.id).in("phase", ["cuadrangular", "cuadrangulares"]).order("match_date", { ascending: true }),
  ])

  if (standingsRes.error && !standingsRes.error.message.includes("stage_standings")) {
    throw new Error(standingsRes.error.message)
  }

  const teamMap = new Map((teamsRes.data ?? []).map((team) => [team.id, team]))
  const updatedAt = (standingsRes.data ?? [])
    .map((row) => row.updated_at as string | null | undefined)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null
  const groups = emptyGroups()
  for (const row of standingsRes.data ?? []) {
    const group = row.group_name as "A" | "B"
    if (group !== "A" && group !== "B") continue
    groups[group].push({ ...row, team: teamMap.get(row.team_id) ?? null })
  }
  for (const g of ["A", "B"] as const) {
    groups[g].sort((a, b) => a.pos - b.pos)
    groups[g].forEach((row, i) => (row.pos = i + 1))
  }

  const hasPlayedMatch = (matchesRes.data ?? []).some((match) =>
    match.local_score !== null && match.away_score !== null && match.status !== "live",
  )

  if (hasPlayedMatch && !matchesRes.error) {
    groups.A = []
    groups.B = []
    const calculated = new Map<string, Row>()
    for (const match of matchesRes.data ?? []) {
      const group = match.group_name as "A" | "B"
      if (group !== "A" && group !== "B") continue
      for (const teamId of [match.local_team_id, match.away_team_id]) {
        const key = `${group}:${teamId}`
        if (!calculated.has(key)) calculated.set(key, { team_id: teamId, group_name: group, pos: 0, pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, team: teamMap.get(teamId) ?? null })
      }
      if (match.local_score === null || match.away_score === null || match.status === "live") continue
      const local = calculated.get(`${group}:${match.local_team_id}`)!
      const away = calculated.get(`${group}:${match.away_team_id}`)!
      local.pj++; away.pj++
      local.gf += match.local_score; local.gc += match.away_score
      away.gf += match.away_score; away.gc += match.local_score
      if (match.local_score > match.away_score) { local.pg++; local.pts += 3; away.pp++ }
      else if (match.local_score < match.away_score) { away.pg++; away.pts += 3; local.pp++ }
      else { local.pe++; away.pe++; local.pts++; away.pts++ }
    }
    for (const group of ["A", "B"] as const) {
      groups[group].push(...[...calculated.values()].filter((row) => row.group_name === group).map((row) => ({ ...row, dif: row.gf - row.gc })).sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf).map((row, index) => ({ ...row, pos: index + 1 })))
    }
  }

  return { season: season.name, seasonId: season.id, groups, matches: matchesRes.data ?? [], updatedAt }
}

function teamPairKey(localTeamId: string, awayTeamId: string) {
  return [localTeamId, awayTeamId].sort().join("|")
}

export function groupTies(matches: Match[]) {
  const buckets = new Map<string, Match[]>()
  for (const match of matches) {
    const key = match.tie_key ?? teamPairKey(match.local_team_id, match.away_team_id)
    buckets.set(key, [...(buckets.get(key) ?? []), match])
  }
  return Array.from(buckets.entries()).map(([tieKey, legs]) => ({
    tieKey,
    legs: [...legs].sort(
      (a, b) =>
        (a.leg ?? 1) - (b.leg ?? 1) ||
        (a.jornada ?? 1) - (b.jornada ?? 1) ||
        (a.match_date ?? "").localeCompare(b.match_date ?? ""),
    ),
  }))
}

function buildTie(teamMap: Map<string, Team>) {
  return (tie: { tieKey: string; legs: Match[] }) => {
    const first = tie.legs[0]
    if (!first) return null
    const goalsFor = (sideTeamId: string) =>
      tie.legs.reduce(
        (sum, match) => sum + (match.local_team_id === sideTeamId ? match.local_score ?? 0 : match.away_score ?? 0),
        0,
      )
    const homeGoals = goalsFor(first.local_team_id)
    const awayGoals = goalsFor(first.away_team_id)
    const complete = tie.legs.every((match) => match.local_score !== null && match.away_score !== null)
    return {
      tieKey: tie.tieKey,
      home: { id: first.local_team_id, team: teamMap.get(first.local_team_id) ?? null },
      away: { id: first.away_team_id, team: teamMap.get(first.away_team_id) ?? null },
      legs: tie.legs,
      aggregate: complete ? { home: homeGoals, away: awayGoals } : null,
      winnerTeamId: complete && homeGoals !== awayGoals ? (homeGoals > awayGoals ? first.local_team_id : first.away_team_id) : null,
    }
  }
}

export async function getBracket() {
  const supabase = await createClient()
  const season = await getActiveSeason(supabase)
  if (!season) return { season: null, seasonId: null, semifinals: [], final: null }

  const [matchesRes, teamsRes] = await Promise.all([
    supabase.from("matches").select("id, phase, tie_key, leg, jornada, local_team_id, away_team_id, local_score, away_score, match_date, match_time, status").eq("season_id", season.id).in("phase", ["semifinal", "final"]).order("match_date"),
    supabase.from("teams").select("id, name, slug, shield_url"),
  ])
  if (matchesRes.error) throw new Error(matchesRes.error.message)

  const teamMap = new Map((teamsRes.data ?? []).map((team) => [team.id, team]))
  const tie = buildTie(teamMap)
  const matches = (matchesRes.data ?? []) as Match[]
  const semifinalMatches = matches.filter((match) => match.phase === "semifinal")
  const finalMatches = matches.filter((match) => match.phase === "final")
  const finalTies = groupTies(finalMatches)

  return {
    season: season.name,
    seasonId: season.id,
    semifinals: groupTies(semifinalMatches).map(tie),
    final: finalTies[0] ? tie(finalTies[0]) : null,
  }
}

export type FinalStageStatus = "not_started" | "groups_running" | "semifinals_running" | "final_running" | "finished"

export async function getFinalStageStatus(): Promise<{ season: string | null; seasonId: string | null; status: FinalStageStatus; updatedAt: string | null }> {
  const supabase = await createClient()
  const season = await getActiveSeason(supabase)
  if (!season) return { season: null, seasonId: null, status: "not_started", updatedAt: null }

  const { data: matches, error } = await supabase
    .from("matches")
    .select("phase, local_score, away_score")
    .eq("season_id", season.id)
    .in("phase", ["cuadrangular", "cuadrangulares", "semifinal", "final"])
  if (error) throw new Error(error.message)

  const rows = matches ?? []
  const final = rows.filter((match) => match.phase === "final")
  const semifinals = rows.filter((match) => match.phase === "semifinal")
  const groups = rows.filter((match) => ["cuadrangular", "cuadrangulares"].includes(match.phase))
  const played = (match: { local_score: number | null; away_score: number | null }) => match.local_score !== null && match.away_score !== null

  let status: FinalStageStatus = "not_started"
  if (final.length && final.every(played)) status = "finished"
  else if (final.length) status = "final_running"
  else if (semifinals.length) status = "semifinals_running"
  else if (groups.length) status = "groups_running"

  return { season: season.name, seasonId: season.id, status, updatedAt: new Date().toISOString() }
}

export async function getFinalStageData() {
  const [standings, bracket, status] = await Promise.all([getStageStandings(), getBracket(), getFinalStageStatus()])
  return { groups: standings.groups, groupMatches: standings.matches, bracket, status: status.status, updatedAt: standings.updatedAt }
}
