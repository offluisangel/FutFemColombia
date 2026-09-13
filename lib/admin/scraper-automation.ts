import type { ScraperId } from "@/lib/admin/scrapers"

type PreviewSummary = {
  fetched?: number
  creates?: number
  updates?: number
  unchanged?: number
  skipped?: number
  warnings?: number
  errors?: number
}

export function shouldAutoApply({
  scraper,
  summary,
  normalized,
}: {
  scraper: ScraperId
  summary: PreviewSummary
  normalized?: Array<Record<string, unknown>>
}) {
  const fetched = summary.fetched ?? 0;
  const errors = summary.errors ?? 0;
  const warnings = summary.warnings ?? 0;
  const skipped = summary.skipped ?? 0;
  const normalizedSkipped = (normalized ?? []).filter((row) => row.skipped).length;

  if (errors > 0) {
    return { apply: false, reason: "Tiene errores en el resumen" };
  }

  if (warnings > 0 || skipped > 0 || normalizedSkipped > 0) {
    return { apply: false, reason: "Tiene advertencias o registros omitidos" };
  }

  if (fetched <= 0) {
    return { apply: false, reason: "No trajo datos" }
  }

  if (scraper === "matches" || scraper === "results" || scraper === "upcoming") {
    const incomplete = (normalized ?? []).filter(
      (row) =>
        !row.skipped &&
        row.status === "scheduled" &&
        (!row.match_date || !row.match_time),
    )
    if (incomplete.length > 0) {
      return {
        apply: false,
        reason: `${incomplete.length} partido(s) programado(s) sin fecha/hora`,
      }
    }
  }

  return { apply: true, reason: "Sin señales de riesgo" }
}
