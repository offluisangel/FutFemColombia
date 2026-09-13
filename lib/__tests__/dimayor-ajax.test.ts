import { afterEach, describe, expect, it, vi } from "vitest"
import {
  buildPhotoUrl,
  fetchPhases,
  fetchScorers,
  getNonce,
  normalizeTeamName,
} from "../dimayor-ajax"

const nonceHtml = '<script>const nonce = "abc123def";</script>'

function response(body: string, ok = true, status = 200) {
  return { ok, status, text: async () => body } as Response
}

describe("dimayor ajax", () => {
  afterEach(() => vi.restoreAllMocks())

  it("extrae el nonce desde la página pública", async () => {
    const fetcher = vi.fn().mockResolvedValue(response(nonceHtml)) as unknown as typeof fetch

    await expect(getNonce(fetcher)).resolves.toBe("abc123def")
    const [callUrl, callInit] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(callUrl).toBe("https://dimayor.com.co")
    expect(callInit.headers).toMatchObject({
      Accept: expect.stringContaining("text/html"),
      "User-Agent": expect.stringContaining("Mozilla"),
    })
  })

  it("reintenta cuando Dimayor responde 403 transitorio", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response("", false, 403))
      .mockResolvedValueOnce(response(nonceHtml)) as unknown as typeof fetch

    await expect(getNonce(fetcher)).resolves.toBe("abc123def")
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it("obtiene el phase_id y envía la competencia", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response(nonceHtml))
      .mockResolvedValueOnce(response(JSON.stringify({ success: true, data: [{ phase_id: 171726 }] }))) as unknown as typeof fetch

    await expect(fetchPhases(171697, fetcher)).resolves.toBe(171726)
    const request = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[1][1]
    expect(request.body).toContain("action=get_phases_for_competition")
    expect(request.body).toContain("competition_id=171697")
  })

  it("parsea filas de goleadoras, normaliza tipos y conserva la foto", async () => {
    const html = `
      <table>
        <tr class=" dimayor-player-clickable" data-player-id="42">
          <td class="col-pos"><span>1</span></td>
          <td class="col-team"><div class="team-box"><img src="https://dimayor.com.co/wp-json/dimayor/v1/image/player-uuid-42.jpg" class="scorer-avatar" onerror="this.outerHTML='<div class=\\'scorer-avatar\\' style=\\'font-size:16px;\\'>👤</div>'" alt="">  <span class="team-name-small">MARIA LOPEZ</span></div></td>
          <td class="col-team"><div class="team-box"> IND. SANTA FE</div></td>
          <td class="col-pts">7</td>
          <td class="col-stat scorer-pj-cell needs-sync" data-player-id="42" data-goals="7"><div class="dimayor-mini-spinner"></div></td>
        </tr>
        <tr class=" dimayor-player-clickable" data-player-id="7">
          <td class="col-pos"><span>2</span></td>
          <td class="col-team"><div class="team-box">  <span class="team-name-small">ANA PEREZ</span></div></td>
          <td class="col-team"><div class="team-box"> AMERICA DE CALI</div></td>
          <td class="col-pts">5</td>
          <td class="col-stat scorer-pj-cell needs-sync" data-player-id="7" data-goals="5"><div class="dimayor-mini-spinner"></div></td>
        </tr>
      </table>`
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response(nonceHtml))
      .mockResolvedValueOnce(response(JSON.stringify({ data: [{ id: 171726 }] })))
      .mockResolvedValueOnce(response(JSON.stringify({ success: true, data: { html } }))) as unknown as typeof fetch

    const scorers = await fetchScorers({ fetcher, competitionId: 171697 })

    expect(scorers).toEqual([
      {
        pos: 1,
        player_id: 42,
        name: "MARIA LOPEZ",
        team_name: "IND. SANTA FE",
        goals: 7,
        photo_uuid: "player-uuid-42.jpg",
      },
      {
        pos: 2,
        player_id: 7,
        name: "ANA PEREZ",
        team_name: "AMERICA DE CALI",
        goals: 5,
        photo_uuid: null,
      },
    ])
    expect(buildPhotoUrl(scorers[0].photo_uuid)).toBe(
      "https://dimayor.com.co/wp-json/dimayor/v1/image/player-uuid-42.jpg",
    )
  })

  it("normaliza nombres de equipo para matching", () => {
    expect(normalizeTeamName("Ind. Santa Fe")).toBe("INDSANTAFE")
    expect(buildPhotoUrl(null)).toBeNull()
  })
})
