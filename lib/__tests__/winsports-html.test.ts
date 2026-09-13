import { afterEach, describe, expect, it, vi } from "vitest"
import {
  scrapeStandingsHTML,
  scrapeStageStandingsHTML,
  scrapeResultsHTML,
  scrapeUpcomingHTML,
  scrapeAllMatchdaysHTML,
} from "@/lib/winsports-html"

function stubFetchFor(urlSnippet: string, html: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      if (!String(input).includes(urlSnippet))
        return { ok: false, status: 404, text: async () => "" }
      return { ok: true, status: 200, text: async () => html }
    }) as unknown as typeof fetch,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const standingsHTML = `<standings-competition>
<table class="table">
  <tbody>
    <tr>
      <td><a>Deportivo Cali</a></td>
      <td>15</td>
      <td>8</td>
      <td>+12</td>
      <td>5</td><td>2</td><td>1</td>
      <td>20</td><td>8</td>
    </tr>
    <tr>
      <td><a>Inter Palmira</a></td>
      <td>9</td>
      <td>8</td>
      <td>-</td>
      <td>2</td><td>3</td><td>3</td>
      <td>7</td><td>10</td>
    </tr>
  </tbody>
</table>
</standings-competition>`

describe("scrapeStandingsHTML", () => {
  it("parsea la tabla y asigna posiciones secuenciales", async () => {
    stubFetchFor("/posiciones", standingsHTML)
    const standings = await scrapeStandingsHTML()

    expect(standings).toHaveLength(2)
    expect(standings[0]).toMatchObject({
      pos: 1,
      name: "Deportivo Cali",
      pts: 15,
      pj: 8,
      pg: 5,
      dif: 12,
    })
    // dif no numérico => fallback gf - gc
    expect(standings[1]).toMatchObject({ pos: 2, name: "Inter Palmira", dif: -3 })
  })
})

function cardHTML({
  jornada,
  local,
  visitante,
  localScore,
  visitanteScore,
  timestamp,
  dateAttr = ":date",
}: {
  jornada: number
  local: string
  visitante: string
  localScore?: number
  visitanteScore?: number
  timestamp?: number
  dateAttr?: ":date" | "date" | "v-bind:date"
}) {
  return `
  <a class="match-card" href="#">
    <div class="header">Fecha ${jornada}</div>
    <div class="teams">
      <div class="team"><span class="name">${local}</span><span class="score">${localScore ?? ""}</span></div>
      <div class="team"><span class="name">${visitante}</span><span class="score">${visitanteScore ?? ""}</span></div>
    </div>
    <div class="status-text">Finalizado</div>
    ${timestamp ? `<format-date ${dateAttr}="${timestamp}"></format-date>` : ""}
  </a>`
}

const TS = 1740429000000

describe("scrapeStageStandingsHTML", () => {
  it("separa las ocho filas en cuatro equipos por grupo", async () => {
    const names = ["Atl. Nacional", "Inter de Bogotá", "Inter Palmira", "Millonarios", "América", "Cali", "Santa Fe", "Orsomarso"]
    const rows = names.map((name) => `<tr><td><a>${name}</a></td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td></tr>`).join("")
    stubFetchFor("/posiciones", `<standings-competition><table class="table"><tbody>${rows}</tbody></table></standings-competition>`)
    const groups = await scrapeStageStandingsHTML()
    expect(groups.A.map((row) => row.name)).toEqual(names.slice(0, 4))
    expect(groups.B.map((row) => row.name)).toEqual(names.slice(4))
  })
})

describe("scrapeResultsHTML", () => {
  it("agrupa por jornada solo partidos con marcador", async () => {
    stubFetchFor(
      "/resultados",
      cardHTML({
        jornada: 3,
        local: "Inter Palmira",
        visitante: "Deportivo Cali",
        localScore: 2,
        visitanteScore: 1,
        timestamp: TS,
      }) +
        cardHTML({
          jornada: 3,
          local: "Medellín",
          visitante: "Pasto",
          timestamp: TS,
        }) +
        cardHTML({
          jornada: 4,
          local: "Santa Fe",
          visitante: "América",
          localScore: 0,
          visitanteScore: 0,
          timestamp: TS,
        }),
    )

    const results = await scrapeResultsHTML()
    expect(results.map((r) => r.jornada)).toEqual([3, 4])
    expect(results[0].partidos).toHaveLength(1)
    expect(results[0].partidos[0]).toMatchObject({
      local: "Inter Palmira",
      visitante: "Cali",
      golesLocal: 2,
      golesVisitante: 1,
    })
    expect(results[0].fecha).toBe(
      new Date(TS).toISOString().slice(0, 10),
    )
  })
})

describe("scrapeUpcomingHTML", () => {
  it("lee el atributo :date (binding Vue) para fecha y hora", async () => {
    stubFetchFor(
      "/partidos",
      cardHTML({
        jornada: 6,
        local: "Cali",
        visitante: "Pasto",
        timestamp: TS,
      }),
    )

    const upcoming = await scrapeUpcomingHTML()
    expect(upcoming).toHaveLength(1)
    expect(upcoming[0].fecha).toBe(new Date(TS).toISOString().slice(0, 10))
    expect(upcoming[0].hora).not.toBe("")
  })

  it("sigue soportando el atributo legacy date", async () => {
    stubFetchFor(
      "/partidos",
      cardHTML({
        jornada: 6,
        local: "Cali",
        visitante: "Pasto",
        timestamp: TS,
        dateAttr: "date",
      }),
    )

    const upcoming = await scrapeUpcomingHTML()
    expect(upcoming[0].fecha).toBe(new Date(TS).toISOString().slice(0, 10))
  })

  it("deja fecha vacía si el format-date no trae atributo", async () => {
    stubFetchFor(
      "/partidos",
      cardHTML({ jornada: 6, local: "Cali", visitante: "Pasto" }),
    )

    const upcoming = await scrapeUpcomingHTML()
    expect(upcoming[0].fecha).toBe("")
    expect(upcoming[0].hora).toBe("")
  })

  it("solo incluye partidos sin marcador", async () => {
    stubFetchFor(
      "/partidos",
      cardHTML({
        jornada: 5,
        local: "Llaneros",
        visitante: "Orsomarso",
        localScore: 1,
        visitanteScore: 1,
        timestamp: TS,
      }) +
        cardHTML({
          jornada: 6,
          local: "Cali",
          visitante: "Pasto",
          timestamp: TS,
        }),
    )

    const upcoming = await scrapeUpcomingHTML()
    expect(upcoming).toHaveLength(1)
    expect(upcoming[0]).toMatchObject({
      local: "Cali",
      visitante: "Pasto",
      jornada: 6,
    })
  })
})

describe("scrapeAllMatchdaysHTML", () => {
  it("agrupa todos los partidos con o sin marcador", async () => {
    stubFetchFor(
      "/resultados",
      cardHTML({
        jornada: 2,
        local: "Medellín",
        visitante: "Pasto",
        localScore: 3,
        visitanteScore: 1,
        timestamp: TS,
      }) +
        cardHTML({
          jornada: 2,
          local: "Cali",
          visitante: "Llaneros",
          timestamp: TS,
        }),
    )

    const matchdays = await scrapeAllMatchdaysHTML()
    expect(matchdays).toHaveLength(1)
    expect(matchdays[0].partidos).toHaveLength(2)
    expect(matchdays[0].partidos[1]).toMatchObject({
      local: "Cali",
      golesLocal: undefined,
    })
  })
})