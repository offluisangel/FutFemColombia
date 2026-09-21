import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { SITE_URL } from "@/lib/constants"
import { HomePageClient } from "@/components/liga/home-page-client"
import { SiteFooter } from "@/components/liga/site-footer"
import type { TeamInfo } from "@/components/liga/site-header"
import type { Scorer } from "@/components/liga/scorers-table"
import { buildPhotoUrl } from "@/lib/dimayor-ajax"
import { getFinalStageStatus } from "@/lib/liga/cuadrangulares-data"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Liga Femenina de Colombia 2026: Posiciones, Resultados y Goleadoras",
  description:
    "Tabla de posiciones, resultados, calendario y goleadoras de la Liga Femenina Colombiana de Fútbol 2026. Sigue la clasificación, los marcadores y las máximas goleadoras de la liga.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Liga Femenina de Colombia 2026: Posiciones, Resultados y Goleadoras",
    description:
      "Tabla de posiciones, resultados, calendario y goleadoras de la Liga Femenina Colombiana de Fútbol 2026.",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Liga Femenina de Colombia 2026",
      },
    ],
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Liga Femenina de Colombia 2026: Posiciones, Resultados y Goleadoras",
    description:
      "Tabla de posiciones, resultados, calendario y goleadoras de la Liga Femenina Colombiana de Fútbol 2026.",
    images: [{ url: `${SITE_URL}/og-image.png`, alt: "Liga Femenina de Colombia 2026" }],
  },
}

export default async function Page() {
  const supabase = await createClient()

  const [teamsRes, standingsRes, matchesRes, scorersRes, finalStageStatusRes] = await Promise.all([
    supabase.from("teams").select("id, name, slug, shield_url"),
    supabase.from("standings").select("*").order("pos", { ascending: true }),
    supabase.from("matches").select("*").order("match_date", { ascending: true }),
    supabase.from("scorers").select("pos, player_id, name, team_name, goals, photo_uuid").order("goals", { ascending: false }).order("pos", { ascending: true }).limit(10),
    getFinalStageStatus(),
  ])

  const teams = (teamsRes.data ?? []) as TeamInfo[]
  const scorers = (scorersRes.data ?? []).map((row): Scorer => ({
    pos: row.pos,
    player_id: row.player_id,
    name: row.name,
    team_name: row.team_name ?? "Equipo por confirmar",
    goals: row.goals,
    photo_url: buildPhotoUrl(row.photo_uuid),
  }))
  const teamMap = new Map(
    teams.map((t) => [t.id, { name: t.name, slug: t.slug, shield_url: t.shield_url }]),
  )

  const standings = (standingsRes.data ?? []).map((row) => {
    const info = teamMap.get(row.team_id) ?? { name: "", slug: "", shield_url: "" }
    return {
      pos: row.pos,
      name: info.name,
      slug: info.slug,
      shield_url: info.shield_url,
      pts: row.pts,
      pj: row.pj,
      pg: row.pg,
      pe: row.pe,
      pp: row.pp,
      gf: row.gf,
      gc: row.gc,
      dif: row.dif,
    }
  })

  // Separar fases: regular (1-16, histórico) vs cuadrangular (1-6, vigente)
  const allMatches = matchesRes.data ?? []
  const regularMatches = allMatches.filter((m) => !m.phase || m.phase === "regular")
  const cuadrangularMatches = allMatches.filter((m) => m.phase === "cuadrangular" || m.phase === "cuadrangulares")
  const semifinalMatches = allMatches.filter((m) => m.phase === "semifinal")
  const finalMatches = allMatches.filter((m) => m.phase === "final")

  const buildGrouped = (list: typeof allMatches) => {
    const g: Record<number, {
      jornada: number
      fecha: string
      partidos: Array<{
        local: string
        visitante: string
        shield_local: string
        shield_away: string
        fecha: string
        hora: string
        local_score: number | null
        away_score: number | null
        group_name: string | null
      }>
    }> = {}
    for (const m of list) {
      const localInfo = teamMap.get(m.local_team_id) ?? { name: "Unknown", slug: "", shield_url: "" }
      const awayInfo = teamMap.get(m.away_team_id) ?? { name: "Unknown", slug: "", shield_url: "" }
      if (!g[m.jornada]) g[m.jornada] = { jornada: m.jornada, fecha: m.match_date ?? "", partidos: [] }
      g[m.jornada].partidos.push({
        local: localInfo.name,
        visitante: awayInfo.name,
        shield_local: localInfo.shield_url,
        shield_away: awayInfo.shield_url,
        fecha: m.match_date ?? "",
        hora: m.match_time ?? "",
        local_score: m.local_score,
        away_score: m.away_score,
        group_name: m.group_name ?? null,
      })
    }
    return Object.values(g).sort((a, b) => a.jornada - b.jornada)
  }

  const matchdays = buildGrouped(regularMatches)
  const cuadrangularMatchdays = buildGrouped(cuadrangularMatches)

  const nextJornadaIdx = matchdays.findIndex((md) => md.partidos.some((p) => p.local_score === null))
  const nextJornada = nextJornadaIdx !== -1 ? matchdays[nextJornadaIdx].jornada : (matchdays[matchdays.length - 1]?.jornada ?? null)

  const upcoming = regularMatches
    .filter((m) => m.status === "scheduled")
    .map((m) => {
      const localInfo = teamMap.get(m.local_team_id) ?? { name: "", slug: "", shield_url: "" }
      const awayInfo = teamMap.get(m.away_team_id) ?? { name: "", slug: "", shield_url: "" }
      return {
        local: localInfo.name,
        visitante: awayInfo.name,
        shield_local: localInfo.shield_url,
        shield_away: awayInfo.shield_url,
        fecha: m.match_date ?? "",
        hora: m.match_time ?? "",
        jornada: m.jornada,
      }
    })

  const cuadrangularUpcoming = cuadrangularMatches
    .filter((m) => m.status === "scheduled")
    .map((m) => {
      const localInfo = teamMap.get(m.local_team_id) ?? { name: "", slug: "", shield_url: "" }
      const awayInfo = teamMap.get(m.away_team_id) ?? { name: "", slug: "", shield_url: "" }
      return {
        local: localInfo.name,
        visitante: awayInfo.name,
        shield_local: localInfo.shield_url,
        shield_away: awayInfo.shield_url,
        fecha: m.match_date ?? "",
        hora: m.match_time ?? "",
        jornada: m.jornada,
        group_name: m.group_name ?? null,
      }
    })
    .sort((a, b) => a.jornada - b.jornada || (a.fecha || "").localeCompare(b.fecha || ""))

  const knockoutMatch = (m: (typeof allMatches)[number], phaseLabel: string) => {
      const localInfo = teamMap.get(m.local_team_id) ?? { name: "", slug: "", shield_url: "" }
      const awayInfo = teamMap.get(m.away_team_id) ?? { name: "", slug: "", shield_url: "" }
      return {
        local: localInfo.name,
        visitante: awayInfo.name,
        shield_local: localInfo.shield_url,
        shield_away: awayInfo.shield_url,
        fecha: m.match_date ?? "",
        hora: m.match_time ?? "",
        jornada: m.jornada,
        group_name: null,
        phase_label: phaseLabel,
      }
    }

  const finalUpcoming = finalMatches
    .filter((m) => m.status === "scheduled")
    .map((m) => knockoutMatch(m, "Gran Final"))
    .sort((a, b) => a.jornada - b.jornada || (a.fecha || "").localeCompare(b.fecha || ""))

  const semifinalUpcoming = semifinalMatches
    .filter((m) => m.status === "scheduled")
    .map((m) => knockoutMatch(m, "Semifinales"))
    .sort((a, b) => a.jornada - b.jornada || (a.fecha || "").localeCompare(b.fecha || ""))

  const knockoutUpcoming = [...finalUpcoming, ...semifinalUpcoming]

  const semifinalMatchdays = buildGrouped(semifinalMatches)
  const finalMatchdays = buildGrouped(finalMatches)

  const teamsLd = standings.map((t) => ({
    "@type": "SportsTeam",
    name: t.name,
    logo: t.shield_url || "",
    position: t.pos,
    points: t.pts,
    url: t.slug ? `${SITE_URL}/equipos/${t.slug}` : SITE_URL,
  }))

  const scorersLd = scorers.map((scorer) => ({
    "@type": "ListItem",
    position: scorer.pos,
    name: scorer.name,
    description: `${scorer.goals} goles para ${scorer.team_name} en la Liga F 2026.`,
  }))

  const eventLd = (
    m: { local: string; visitante: string; fecha: string; hora: string },
    roundLabel: string,
  ) => {
    if (!m.fecha) return null
    return {
      "@type": "SportsEvent",
      name: `${m.local} vs ${m.visitante}`,
      startDate: m.hora ? `${m.fecha}T${m.hora}:00` : m.fecha,
      eventStatus: "https://schema.org/EventScheduled",
      description: `Partido ${roundLabel} de la Liga Femenina Colombiana 2026 entre ${m.local} y ${m.visitante}.`,
      organizer: {
        "@type": "SportsOrganization",
        name: "Liga Femenina de Colombia",
        url: SITE_URL,
      },
      location: { "@type": "Place", name: "Colombia" },
      competitor: [
        { "@type": "SportsTeam", name: m.local },
        { "@type": "SportsTeam", name: m.visitante },
      ],
    }
  }

  const upcomingLd = upcoming.map((m) => eventLd(m, "de la temporada regular")).filter(Boolean)
  const cuadrangularLd = cuadrangularUpcoming.map((m) => eventLd(m, "de los cuadrangulares")).filter(Boolean)
  const knockoutLd = knockoutUpcoming.map((m) => eventLd(m, m.phase_label === "Gran Final" ? "de la gran final" : "de las semifinales")).filter(Boolean)

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Liga Femenina de Colombia",
        url: SITE_URL,
        description: "Tabla de posiciones, resultados, calendario y goleadoras de la Liga Femenina Colombiana de Fútbol 2026.",
        inLanguage: "es-CO",
      },
      {
        "@type": "SportsOrganization",
        name: "Liga Femenina de Colombia",
        url: SITE_URL,
        sport: "Fútbol",
        location: { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "CO" } },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: SITE_URL,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: "Tabla de Posiciones",
        itemListElement: teamsLd.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: t,
        })),
      },
      {
        "@type": "ItemList",
        name: "Goleadoras de la Liga F 2026",
        itemListElement: scorersLd,
      },
      ...upcomingLd,
      ...cuadrangularLd,
      ...knockoutLd,
    ],
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <HomePageClient
        teams={teams}
        standings={standings}
        scorers={scorers}
        matchdays={matchdays}
        upcoming={upcoming}
        nextJornada={nextJornada}
        cuadrangularMatchdays={cuadrangularMatchdays}
        cuadrangularUpcoming={cuadrangularUpcoming}
        semifinalMatchdays={semifinalMatchdays}
        finalMatchdays={finalMatchdays}
        knockoutUpcoming={knockoutUpcoming}
        finalStageActive={["groups_running", "semifinals_running", "final_running"].includes(finalStageStatusRes.status)}
        finalStageStatus={finalStageStatusRes.status}
      >
        <SiteFooter />
      </HomePageClient>
    </>
  )
}
