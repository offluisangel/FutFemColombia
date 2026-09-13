const DIMAYOR_BASE_URL = "https://dimayor.com.co"
const ADMIN_AJAX_URL = `${DIMAYOR_BASE_URL}/wp-admin/admin-ajax.php`
const IMAGE_BASE_URL = `${DIMAYOR_BASE_URL}/wp-json/dimayor/v1/image`

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-CO,es;q=0.9,en;q=0.8",
  Referer: DIMAYOR_BASE_URL,
}

const RETRY_STATUSES = new Set([403, 429, 500, 502, 503, 504])

export const SEASON_ID = 169678
export const DEFAULT_COMPETITION_ID = 171697
export const DEFAULT_PHASE_ID = 171726

export interface Scorer {
  pos: number
  player_id: number
  name: string
  team_name: string
  goals: number
  photo_uuid: string | null
}

export type Fetcher = typeof fetch

interface FetchOptions {
  fetcher?: Fetcher
  competitionId?: number | string
  phaseId?: number | string
  nonce?: string
}

function envValue(name: string): string | undefined {
  return typeof process !== "undefined" ? process.env[name] : undefined
}

function competitionId(): string {
  return envValue("DIMAYOR_COMPETITION_ID") || String(DEFAULT_COMPETITION_ID)
}

function cleanText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim()
}

function numberFrom(value: string, fallback = 0): number {
  const match = value.replace(/\./g, "").match(/-?\d+/)
  return match ? Number(match[0]) : fallback
}

export function buildPhotoUrl(photoUuid: string | null | undefined): string | null {
  if (!photoUuid) return null
  const value = photoUuid.trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `${IMAGE_BASE_URL}/${encodeURIComponent(value)}`
}

function formBody(values: Record<string, string | number>): string {
  return new URLSearchParams(
    Object.entries(values).map(([key, value]) => [key, String(value)]),
  ).toString()
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  fetcher: Fetcher = fetch,
  attempts = 3,
): Promise<Response> {
  const delayMs = 500
  let lastError: unknown

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetcher(url, init)
      if (!RETRY_STATUSES.has(response.status)) return response
      lastError = new Error(`HTTP ${response.status} desde ${url}`)
    } catch (error) {
      lastError = error
    }

    if (attempt < attempts - 1) {
      const jitter = Math.floor(Math.random() * 250)
      await new Promise((resolve) => setTimeout(resolve, delayMs * 2 ** attempt + jitter))
    }
  }

  throw lastError
}

async function responseText(response: Response, url: string): Promise<string> {
  if (!response.ok) throw new Error(`HTTP ${response.status} desde ${url}`)
  return response.text()
}

export async function getNonce(fetcher: Fetcher = fetch): Promise<string> {
  const response = await fetchWithRetry(
    DIMAYOR_BASE_URL,
    { headers: BROWSER_HEADERS },
    fetcher,
  )
  const html = await responseText(response, DIMAYOR_BASE_URL)
  const match = html.match(/const\s+nonce\s*=\s*["']([0-9a-f]+)["']/i)
  if (!match) throw new Error("No se encontró el nonce de Dimayor")
  return match[1]
}

function phaseIdFrom(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value)
  if (!value || typeof value !== "object") return null

  const object = value as Record<string, unknown>
  for (const key of ["phase_id", "phaseId", "id"]) {
    const id = phaseIdFrom(object[key])
    if (id !== null) return id
  }
  for (const child of Object.values(object)) {
    const id = phaseIdFrom(child)
    if (id !== null) return id
  }
  return null
}

export async function fetchPhases(
  competition: number | string = competitionId(),
  fetcher: Fetcher = fetch,
  providedNonce?: string,
): Promise<number> {
  const nonce = providedNonce || await getNonce(fetcher)
  const response = await fetchWithRetry(
    ADMIN_AJAX_URL,
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded", ...BROWSER_HEADERS },
      body: formBody({ action: "get_phases_for_competition", competition_id: competition, nonce }),
    },
    fetcher,
  )
  const text = await responseText(response, ADMIN_AJAX_URL)
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("Respuesta inválida al obtener fases de Dimayor")
  }
  const id = phaseIdFrom(data)
  if (id === null) throw new Error("No se encontró una fase en la respuesta de Dimayor")
  return id
}

function parsePhotoUuid(row: string): string | null {
  const image = row.match(/(?:src|data-src)=["'][^"']*\/image\/([^"'/?#]+)[^"']*/i)
  return image ? decodeURIComponent(image[1]) : null
}

export function parseScorers(html: string): Scorer[] {
  const rows = html.match(/<tr\b[^>]*\bdimayor-player-clickable\b[^>]*>[\s\S]*?<\/tr>/gi) || []
  return rows.flatMap((row) => {
    const player = row.match(/data-player-id=["'](\d+)["']/i)
    if (!player) return []

    const cells = [...row.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi)]
    const cell = (className: string) => {
      const found = cells.find(([, attrs]) => new RegExp(`\\b${className}\\b`).test(attrs))
      return found ? cleanText(found[2]) : ""
    }
    const cellByContent = (className: string, marker: RegExp) => {
      const found = cells.find(
        ([, attrs, content]) => new RegExp(`\\b${className}\\b`).test(attrs) && marker.test(content),
      )
      return found ? found[2] : ""
    }

    const nameCell = cellByContent("col-team", /team-name-small/i)
    const nameMatch = nameCell.match(/team-name-small">\s*([^<]+)\s*<\/span>/i)
    const teamCell = cells.find(
      ([, attrs, content]) => /\bcol-team\b/.test(attrs) && !/team-name-small/i.test(content),
    )

    return [{
      pos: numberFrom(cell("col-pos")),
      player_id: Number(player[1]),
      name: (nameMatch ? nameMatch[1] : cleanText(nameCell)).trim(),
      team_name: teamCell ? cleanText(teamCell[2]).trim() : "",
      goals: numberFrom(cell("col-pts")),
      photo_uuid: parsePhotoUuid(row),
    }]
  })
}

export async function fetchScorers(options: FetchOptions | Fetcher = {}): Promise<Scorer[]> {
  const config: FetchOptions = typeof options === "function" ? { fetcher: options } : options
  const fetcher = config.fetcher || fetch
  const competition = config.competitionId ?? competitionId()
  const nonce = config.nonce || await getNonce(fetcher)
  const phase = config.phaseId ?? await fetchPhases(competition, fetcher, nonce)
  const response = await fetchWithRetry(
    ADMIN_AJAX_URL,
    {
      method: "POST",
      headers: { Accept: "text/html", "Content-Type": "application/x-www-form-urlencoded", ...BROWSER_HEADERS },
      body: formBody({
        action: "get_dynamic_content_v5",
        type: "goleadores",
        competition_id: competition,
        phase_id: phase,
        matchday: 0,
        nonce,
      }),
    },
    fetcher,
  )
  const text = await responseText(response, ADMIN_AJAX_URL)
  let html = text
  try {
    const data = JSON.parse(text)
    html = (data?.data as { html?: string } | undefined)?.html ?? text
  } catch {
    // Dimayor a veces responde HTML plano
  }
  return parseScorers(html)
}

export function normalizeTeamName(value: string): string {
  return value.toUpperCase().replace(/[.\s]/g, "")
}
