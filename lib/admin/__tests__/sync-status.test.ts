import { describe, expect, it } from "vitest"
import { latestRunsByScraper } from "@/lib/admin/sync-status"
import type { ScraperRun } from "@/lib/types/supabase"

function run(
  scraper: string,
  status: string,
  createdAt: string,
): ScraperRun {
  return {
    id: `${scraper}-${createdAt}`,
    scraper,
    status,
    source_url: null,
    started_at: createdAt,
    finished_at: null,
    duration_ms: null,
    triggered_by: null,
    summary: {},
    raw_data: null,
    normalized_data: null,
    diff: null,
    warnings: [],
    error_message: null,
    applied_at: null,
    rejected_at: null,
    rejection_reason: null,
    created_at: createdAt,
  }
}

describe("latestRunsByScraper", () => {
  it("returns the newest run for each requested scraper", () => {
    const latest = latestRunsByScraper(
      [
        run("matches", "applied", "2026-09-20T10:00:00.000Z"),
        run("matches", "applied", "2026-09-21T10:00:00.000Z"),
        run("scorers", "skipped", "2026-09-19T10:00:00.000Z"),
      ],
      ["matches", "results", "scorers"],
    )

    expect(latest.matches?.created_at).toBe("2026-09-21T10:00:00.000Z")
    expect(latest.results).toBeUndefined()
    expect(latest.scorers?.created_at).toBe("2026-09-19T10:00:00.000Z")
  })

  it("keeps the latest state per scraper (dashboard case)", () => {
    const latest = latestRunsByScraper([
      run("matches", "failed", "2026-09-20T10:00:00.000Z"),
      run("matches", "applied", "2026-09-21T10:00:00.000Z"),
      run("scorers", "skipped", "2026-09-19T10:00:00.000Z"),
    ])

    expect(latest.matches?.status).toBe("applied")
    expect(latest.scorers?.status).toBe("skipped")
  })

  it("returns every scraper found when no ids are requested", () => {
    const latest = latestRunsByScraper([
      run("standings", "applied", "2026-09-20T10:00:00.000Z"),
      run("scorers", "skipped", "2026-09-19T10:00:00.000Z"),
    ])

    expect(Object.keys(latest).sort()).toEqual(["scorers", "standings"])
    expect(latest.standings?.status).toBe("applied")
    expect(latest.scorers?.status).toBe("skipped")
  })

  it("does not discard an older pending run", () => {
    const runs = [
      run("matches", "pending_review", "2026-09-01T10:00:00.000Z"),
      run("matches", "applied", "2026-09-21T10:00:00.000Z"),
    ]

    expect(runs.some((item) => item.status === "pending_review")).toBe(true)
    expect(latestRunsByScraper(runs).matches?.status).toBe("applied")
  })
})