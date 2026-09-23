import { describe, expect, it } from "vitest"
import { ADMIN_NAV_GROUPS } from "@/components/admin/admin-nav"
import { SYNC_AREAS } from "@/lib/admin/sync-areas"

describe("admin navigation", () => {
  it("includes every canonical competition route", () => {
    const routes = ADMIN_NAV_GROUPS.flatMap((group) => group.items).map(
      (item) => item.href,
    )

    expect(routes).toEqual(
      expect.arrayContaining([
        "/admin/standings",
        "/admin/matches",
        "/admin/scorers",
        "/admin/cuadrangulares",
      ]),
    )
  })
})

describe("sync areas", () => {
  it("defines one area for each operator-facing sync workflow", () => {
    expect(SYNC_AREAS.map((area) => area.id)).toEqual([
      "standings",
      "matches",
      "scorers",
      "cuadrangular",
    ])

    expect(SYNC_AREAS.every((area) => area.scraperIds.length > 0)).toBe(true)
  })
})