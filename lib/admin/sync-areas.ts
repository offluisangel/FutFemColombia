import type { ScraperId } from "@/lib/admin/scrapers"

export type SyncAreaId = "standings" | "matches" | "scorers" | "cuadrangular"

export type SyncArea = {
  id: SyncAreaId
  label: string
  href: string
  scraperIds: ScraperId[]
}

export const SYNC_AREAS: SyncArea[] = [
  {
    id: "standings",
    label: "Posiciones",
    href: "/admin/standings",
    scraperIds: ["standings"],
  },
  {
    id: "matches",
    label: "Partidos",
    href: "/admin/matches",
    scraperIds: ["matches", "results", "upcoming"],
  },
  {
    id: "scorers",
    label: "Goleadoras",
    href: "/admin/scorers",
    scraperIds: ["scorers"],
  },
  {
    id: "cuadrangular",
    label: "Cuadrangulares",
    href: "/admin/cuadrangulares",
    scraperIds: ["stage-standings", "cuadrangular-matches"],
  },
]

export function getSyncArea(id: SyncAreaId): SyncArea {
  const area = SYNC_AREAS.find((candidate) => candidate.id === id)
  if (!area) {
    throw new Error(`Unknown sync area: ${id}`)
  }
  return area
}