import { describe, expect, it } from "vitest"
import { checkRateLimit } from "@/lib/rate-limit"

describe("checkRateLimit", () => {
  it("permite hasta el limite y luego bloquea", () => {
    const now = 1_000_000
    const key = "admin-api:1.2.3.4"

    expect(checkRateLimit(key, 2, 1_000, now).allowed).toBe(true)
    expect(checkRateLimit(key, 2, 1_000, now + 100).allowed).toBe(true)

    const blocked = checkRateLimit(key, 2, 1_000, now + 200)

    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it("reinicia la ventana cuando expira", () => {
    const start = 10_000
    const key = "internal-scrapers-auto:5.6.7.8"

    expect(checkRateLimit(key, 1, 1_000, start).allowed).toBe(true)

    const afterWindow = checkRateLimit(key, 1, 1_000, start + 1_500)

    expect(afterWindow.allowed).toBe(true)
    expect(afterWindow.remaining).toBe(0)
  })
})