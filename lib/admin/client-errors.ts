export async function getApiErrorMessage(res: Response, fallback = "Ocurrió un error") {
  try {
    const payload = await res.json()
    if (typeof payload?.error === "string") return payload.error
    if (typeof payload?.error?.message === "string") return payload.error.message
    if (typeof payload?.message === "string") return payload.message
  } catch {
    // ignore malformed responses
  }

  return fallback
}
