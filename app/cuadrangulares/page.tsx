import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { SITE_URL } from "@/lib/constants"
import { CuadrangularesClient } from "@/components/liga/cuadrangulares-client"
import { getFinalStageData, type FinalStageStatus } from "@/lib/liga/cuadrangulares-data"

const STATUS_LABEL: Record<FinalStageStatus, string> = {
  not_started: "Fase final por iniciar",
  groups_running: "Cuadrangulares en curso",
  semifinals_running: "Semifinales en curso",
  final_running: "Gran Final en curso",
  finished: "Temporada 2026 finalizada",
}

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  let title = "Fase Final — Cuadrangulares, Semifinales y Gran Final"
  let description =
    "Toda la información de la fase final de la Liga Femenina Colombiana: cuadrangulares, semifinales y gran final. Grupos, tablas de posiciones y llaves del playoff."

  try {
    const data = await getFinalStageData()
    const groupsDone = data.groups.A.length > 0 || data.groups.B.length > 0
    if (groupsDone) {
      const leaders: string[] = []
      for (const g of ["A", "B"] as const) {
        const table = data.groups[g]
        if (table[0]?.team?.name) leaders.push(`${table[0].team.name} (Grupo ${g})`)
      }
      const leadersText = leaders.length
        ? `Tabla de los cuadrangulares: lideran ${leaders.join(" y ")}.`
        : ""
      description = `${leadersText} Grupos, posiciones, llaves de semifinales y gran final de la Liga Femenina Colombiana 2026.`
    }
    title = `${STATUS_LABEL[data.status]} — Liga Femenina Colombiana 2026`
  } catch {
    // usa metadata por defecto si falla la consulta
  }

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/cuadrangulares`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/cuadrangulares`,
      siteName: "Liga Femenina Colombia",
      images: [
        { url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: "Fase Final - Liga Femenina de Colombia" },
      ],
      locale: "es_CO",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: `${SITE_URL}/og-image.png`, alt: "Fase Final - Liga Femenina de Colombia" }],
    },
  }
}

export default async function Page() {
  const supabase = await createClient()
  const { data: teams } = await supabase.from("teams").select("id, name, slug, shield_url")

  let data: Awaited<ReturnType<typeof getFinalStageData>> | null = null
  try {
    data = await getFinalStageData()
  } catch {
    data = null
  }

  const events = buildSportsEvents(data)

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Fase Final - Liga Femenina de Colombia",
        description:
          "Cuadrangulares, semifinales y gran final de la Liga Femenina Colombiana de Fútbol 2026.",
        url: `${SITE_URL}/cuadrangulares`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Fase Final", item: `${SITE_URL}/cuadrangulares` },
        ],
      },
      ...events,
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CuadrangularesClient teams={teams ?? []} data={data} />
    </>
  )
}

type Tie = NonNullable<Awaited<ReturnType<typeof getFinalStageData>>["bracket"]["semifinals"][0]>
type Event = {
  "@type": string
  name: string
  startDate?: string
  eventStatus?: string
  description?: string
  organizer?: { "@type": string; name: string; url: string }
  location?: { "@type": string; name: string }
  competitor?: Array<{ "@type": string; name: string }>
}

function buildSportsEvents(data: Awaited<ReturnType<typeof getFinalStageData>> | null): Event[] {
  if (!data) return []
  const allTies: Array<{ label: string; tie: Tie | null }> = [
    ...(data.bracket.semifinals ?? []).map((t, i) => ({ label: `Semifinal ${i + 1}`, tie: t })),
    { label: "Gran Final", tie: data.bracket.final },
  ]

  const events: Event[] = []
  for (const { label, tie } of allTies) {
    if (!tie) continue
    for (const leg of tie.legs ?? []) {
      const home = tie.home?.team?.name
      const away = tie.away?.team?.name
      if (!home || !away) continue
      const e: Event = {
        "@type": "SportsEvent",
        name: `${label}: ${home} vs ${away} | Liga Femenina 2026`,
        startDate: leg.match_date && leg.match_time ? `${leg.match_date}T${leg.match_time}:00` : (leg.match_date ?? undefined),
        eventStatus: leg.local_score !== null && leg.away_score !== null ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled",
        description: `Partido de ${label.toLowerCase()} de la Liga Femenina Colombiana 2026 entre ${home} y ${away}.`,
        organizer: {
          "@type": "SportsOrganization",
          name: "Liga Femenina de Colombia",
          url: SITE_URL,
        },
        location: { "@type": "Place", name: "Colombia" },
        competitor: [
          { "@type": "SportsTeam", name: home },
          { "@type": "SportsTeam", name: away },
        ],
      }
      events.push(e)
    }
  }
  return events
}
