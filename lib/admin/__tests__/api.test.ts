import { describe, expect, it } from "vitest"
import { apiError, getErrorMessage } from "@/lib/admin/api"

describe("apiError", () => {
  it("construye una respuesta JSON con code y status", async () => {
    const res = apiError("mensaje", 400, "BAD_REQUEST", { campo: "name" })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({
      error: { code: "BAD_REQUEST", message: "mensaje", details: { campo: "name" } },
    })
  })

  it("usa defaults 500 y SERVER_ERROR", async () => {
    const res = apiError("boom")
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe("SERVER_ERROR")
  })
})

describe("getErrorMessage", () => {
  it("extrae mensaje de Error, string o fallback", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom")
    expect(getErrorMessage("texto")).toBe("texto")
    expect(getErrorMessage(undefined)).toBe("Error inesperado")
    expect(getErrorMessage(undefined, "fallback custom")).toBe("fallback custom")
  })
})