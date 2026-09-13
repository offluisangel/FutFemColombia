import { NextResponse } from "next/server"

export function apiError(message: string, status = 500, code = "SERVER_ERROR", details?: unknown) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status },
  )
}

export function getErrorMessage(payload: unknown, fallback = "Error inesperado") {
  if (payload instanceof Error) return payload.message
  if (typeof payload === "string") return payload
  return fallback
}
