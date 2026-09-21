import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { generateTeamDescription } from "@/lib/generate-team-description"
import { SITE_URL } from "@/lib/constants"
import { TeamPageClient } from "@/components/liga/team-page-client"
import { SiteFooter } from "@/components/liga/site-footer"
import { getBracket, getFinalStageStatus, getStageStandings } from "@/lib/liga/cuadrangulares-data"

export const dynamic = "force-dynamic"

type TeamCompetitionStatus = "active" | "eliminated" | "champion"

// Cupo a la siguiente fase desde la fase regular. TODO: moverlo a la config de
// la temporada (seasons) en lugar de hardcodear el formato 2026.
const REGULAR_QUALIFYING_SPOTS = 8

async function getTeamBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("teams")
    .select("id, name, full_name, slug, city, shield_url")
    .eq("slug", slug)
    .single()
  return data
}

  function matchDateValue(date: string | null) {
    return date ? new Date(`${date}T00:00:00`).getTime() : 0
  }

  // Las llaves de fase final pueden llegar sin fecha definida (semifinal/final
  // programadas o provisionales). Para resultados los tratamos como lo más
  // reciente; para próximos como los primeros por jugar.
  function matchRecencyValue(date: string | null) {
    return date ? new Date(`${date}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER
  }

async function getTeamCompetitionStatus(teamId: string): Promise<TeamCompetitionStatus> {
  const supabase = await createClient()

  const { data: activeSeason } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .maybeSingle()

  // Sin temporada activa nadie sigue en competencia.
  if (!activeSeason) return "eliminated"

  const [finalStageStatusRes, bracketRes, stageStandingsRes, regularStandingRes] = await Promise.all([
    getFinalStageStatus(),
    getBracket(),
    getStageStandings(),
    supabase
      .from("standings")
      .select("pos")
      .eq("season_id", activeSeason.id)
      .eq("team_id", teamId)
      .maybeSingle(),
  ])

  const stage = finalStageStatusRes.status
  const { semifinals, final } = bracketRes
  const groups = stageStandingsRes.groups
  const semifinalTies = semifinals.filter((t): t is NonNullable<typeof t> => t !== null)

  const isInSemifinal = semifinalTies.some((t) => t.home.id === teamId || t.away.id === teamId)
  const advancedFromSemifinal = semifinalTies.some((t) => t.winnerTeamId === teamId)
  const isInFinal = final !== null && (final.home.id === teamId || final.away.id === teamId)

  // Campeón cuando la llave de la final tiene un ganador por agregado.
  if (final?.winnerTeamId === teamId) return "champion"

  // Temporada terminada: solo el campeón sigue arriba (subcampeón y resto fuera).
  if (stage === "finished") return "eliminated"

  if (stage === "final_running") {
    if (!isInFinal) return "eliminated"
    // Llave decidida pero sin campeón retornado arriba → el que queda es el
    // subcampeón (final perdida).
    return final!.winnerTeamId ? "eliminated" : "active"
  }

  if (stage === "semifinals_running") {
    if (!isInSemifinal) return "eliminated"
    const tie = semifinalTies.find((t) => t.home.id === teamId || t.away.id === teamId)!
    return advancedFromSemifinal || !tie.winnerTeamId ? "active" : "eliminated"
  }

  if (stage === "groups_running") {
    const participants = new Set<string>()
    for (const g of ["A", "B"] as const) groups[g].forEach((row) => participants.add(row.team_id))
    // Sin tabla de grupos publicada no podemos afirmar eliminación.
    if (participants.size === 0) return "active"
    if (!participants.has(teamId)) return "eliminated"

    const groupRow =
      groups.A.find((row) => row.team_id === teamId) ??
      groups.B.find((row) => row.team_id === teamId)
    if (!groupRow) return "active"

    const groupMatches = stageStandingsRes.matches.filter((m) => m.group_name === groupRow.group_name)
    const groupFinished =
      groupMatches.length > 0 &&
      groupMatches.every((m) => m.local_score !== null && m.away_score !== null && m.status !== "live")
    if (!groupFinished) return "active"
    return groupRow.pos <= 2 ? "active" : "eliminated"
  }

  // Fase regular: no se elimina a nadie mientras queden partidos por jugar.
  const { count: scheduledCount } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("season_id", activeSeason.id)
    .eq("status", "scheduled")
  if ((scheduledCount ?? 0) > 0) return "active"

  const regularPosition = regularStandingRes.data?.pos
  if (typeof regularPosition === "number") {
    return regularPosition <= REGULAR_QUALIFYING_SPOTS ? "active" : "eliminated"
  }

  // Si aún no hay tabla publicada, evitamos afirmar que el equipo quedó fuera.
  return "active"
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const team = await getTeamBySlug(slug)
  if (!team) return {}

  const competitionStatus = await getTeamCompetitionStatus(team.id)

  const title = competitionStatus === "champion"
    ? `${team.full_name}: Campeón Liga Femenina 2026 — campaña y resultados`
    : competitionStatus === "active"
      ? `${team.full_name}: Posiciones, resultados y próximos partidos 2026`
      : `${team.full_name}: Resumen de temporada y resultados 2026`
  const description = competitionStatus === "champion"
    ? `${team.full_name} se coronó campeón de la Liga Femenina Colombiana 2026. Consulta su campaña completa: posición, resultados, estadísticas y partidos clave del título.`
    : competitionStatus === "active"
      ? `Consulta la posición, resultados, calendario y estadísticas de ${team.full_name} en la Liga Femenina Colombiana 2026. Sigue la tabla de posiciones, los últimos resultados y los próximos partidos.`
      : `Revisa la campaña completa de ${team.full_name} en la Liga Femenina Colombiana 2026: posición final, resultados, estadísticas y balance de temporada.`

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/equipos/${slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/equipos/${slug}`,
      images: [
        { url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: team.full_name },
      ],
      locale: "es_CO",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: `${SITE_URL}/og-image.png`, alt: team.full_name }],
    },
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const team = await getTeamBySlug(slug)
  if (!team) notFound()

  const supabase = await createClient()

  const [teamsRes, standingsRes, allMatchesRes] = await Promise.all([
    supabase.from("teams").select("id, name, slug, shield_url"),
    supabase.from("standings").select("pos, team_id, pts, pj, pg, pe, pp, gf, gc, dif"),
    supabase.from("matches").select("local_score, away_score, local_team_id, away_team_id, match_date, match_time, jornada, status, phase, leg"),
  ])

  const dbTeams = teamsRes.data ?? []
  const teamRow = dbTeams.find((t) => t.name === team.name)
  if (!teamRow) notFound()

  const teamMap = new Map(dbTeams.map((t) => [t.id, t.name]))
  const shieldMap = new Map(dbTeams.map((t) => [t.name, t.shield_url]))

  const allStandings = (standingsRes.data ?? []).map((r) => ({
    pos: r.pos,
    name: teamMap.get(r.team_id) ?? "",
    pts: r.pts, pj: r.pj, pg: r.pg, pe: r.pe, pp: r.pp, gf: r.gf, gc: r.gc, dif: r.dif,
  }))

  let standing = allStandings.find((t) => t.name === team.name)
  if (!standing) {
    const idx = dbTeams.findIndex((t) => t.name === team.name)
    standing = { pos: idx + 1, name: team.name, pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0 }
  }

  const tid = teamRow.id
  const matches = allMatchesRes.data ?? []

  const teamResults = matches
    .filter((m) => m.status === "played" && (m.local_team_id === tid || m.away_team_id === tid))
    .sort((a, b) => matchRecencyValue(b.match_date) - matchRecencyValue(a.match_date))
    .slice(0, 3)
    .map((m) => ({
      local: teamMap.get(m.local_team_id) ?? "",
      shield_local: shieldMap.get(teamMap.get(m.local_team_id) ?? "") ?? "",
      visitante: teamMap.get(m.away_team_id) ?? "",
      shield_away: shieldMap.get(teamMap.get(m.away_team_id) ?? "") ?? "",
      golesLocal: m.local_score ?? 0,
      golesVisitante: m.away_score ?? 0,
      fecha: m.match_date ?? "",
      jornada: m.jornada,
      hora: m.match_time ?? "",
      phase: m.phase ?? "",
      leg: m.leg ?? null,
    }))

  const upcomingMatches = matches
    .filter((m) => m.status === "scheduled" && (m.local_team_id === tid || m.away_team_id === tid))
    .sort((a, b) => matchDateValue(a.match_date) - matchDateValue(b.match_date))
    .slice(0, 3)
    .map((m) => ({
      local: teamMap.get(m.local_team_id) ?? "",
      shield_local: shieldMap.get(teamMap.get(m.local_team_id) ?? "") ?? "",
      visitante: teamMap.get(m.away_team_id) ?? "",
      shield_away: shieldMap.get(teamMap.get(m.away_team_id) ?? "") ?? "",
      fecha: m.match_date ?? "",
      hora: m.match_time ?? "",
      jornada: m.jornada,
      phase: m.phase ?? "",
      leg: m.leg ?? null,
    }))

  const competitionStatus = await getTeamCompetitionStatus(team.id)

  const playedMatches = matches.filter((m) => m.status === "played")
  const jornadaGroups = new Map<number, { jornada: number; fecha: string; partidos: { local: string; golesLocal: number; visitante: string; golesVisitante: number }[] }>()
  for (const m of playedMatches) {
    const j = m.jornada
    if (!jornadaGroups.has(j)) {
      jornadaGroups.set(j, { jornada: j, fecha: m.match_date ?? "", partidos: [] })
    }
    jornadaGroups.get(j)!.partidos.push({
      local: teamMap.get(m.local_team_id) ?? "",
      golesLocal: m.local_score ?? 0,
      visitante: teamMap.get(m.away_team_id) ?? "",
      golesVisitante: m.away_score ?? 0,
    })
  }
  const resultsForDesc = Array.from(jornadaGroups.values())

  const description = generateTeamDescription(team.full_name, standing, resultsForDesc, competitionStatus)
  const teams = dbTeams

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "SportsTeam",
              name: team.full_name,
              logo: team.shield_url || "",
              url: `${SITE_URL}/equipos/${slug}`,
              memberOf: { "@type": "SportsOrganization", name: "Liga Femenina de Colombia" },
              location: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: team.city, addressCountry: "CO" } },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
                { "@type": "ListItem", position: 2, name: team.full_name, item: `${SITE_URL}/equipos/${slug}` },
              ],
            },
          ],
        }) }}
      />
      <TeamPageClient
        info={{ nombreCompleto: team.full_name, slug: team.slug, ciudad: team.city ?? "" }}
        team={standing}
        teams={teams}
        standings={allStandings}
        description={description}
        recentResults={teamResults}
        upcomingMatches={upcomingMatches}
        competitionStatus={competitionStatus}
        shieldUrl={team.shield_url || ""}
      >
        <SiteFooter />
      </TeamPageClient>
    </>
  )
}
