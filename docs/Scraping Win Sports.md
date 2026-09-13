# Scraping Win Sports — Liga Femenina

Documentación del sistema de ingesta de FutFemColombia: **Win Sports → Supabase → Next.js**. Cubre fuentes, fallback API/HTML, scripts, persistencia y operación en producción.

---

## 1. Qué hace y stack

Los scrapers consultan la **API interna de Win Sports** (Opta) y, como respaldo, el **HTML público** de `winsports.co`, normalizan el resultado y lo guardan en **Supabase** (Postgres + RLS) usando la `service_role`. La app Next.js solo lee Supabase — nunca hace fetch directo a Win Sports en producción.

**Stack real:** `fetch` nativo Node, `cheerio` (HTML), `tsx`, `@supabase/supabase-js`, `Zod` (validación admin), `Vitest` (70+ tests).

```mermaid
flowchart TD
  WS_API[Win Sports API<br/>/api/standings<br/>/api/matches/competition]
  WS_HTML[Win Sports HTML<br/>/posiciones<br/>/partidos<br/>/resultados]
  WS_API --> FALLBACK{scrapeWithFallback}
  WS_HTML --> FALLBACK
  FALLBACK --> PREVIEW[buildScraperPreview<br/>+ diff vs DB]
  PREVIEW --> RUNS[(scraper_runs<br/>pending_review)]
  RUNS --> APPLY[applyScraperData<br/>/ manual]
  APPLY --> SAVE[lib/save-to-supabase.ts]
  SAVE --> DB[(Supabase<br/>teams<br/>seasons<br/>matches<br/>standings<br/>stage_standings<br/>scorers)]
  DB --> APP[Next.js<br/>/ , /cuadrangulares<br/>/equipos/[slug]]
```

Scripts en `scripts/`, orquestación en `lib/admin/scrapers.ts`, persistencia en `lib/save-to-supabase.ts`.

---

## 2. Fuentes y `stageId`

| Fuente | URL | `stageId` | Uso |
|---|---|---|---|
| Posiciones regular | `win-sports-api.md` §2.1 | `85b4l7dazn8mc4fivur3lkb2s` | `fetchStandings()` |
| Posiciones cuadrangular | `win-sports-api.md` §2.1 | `84n6bl7fg3hut5al91qnc9ams` | `fetchStageStandings()` → `stage_standings` Grupo A/B |
| Partidos regular | `…/api/matches/competition?stageId=85b4…&week=N&isFuture=bool` | `85b4…` | `fetchAllMatchdays()` / `fetchUpcomingWeeks()` |
| Partidos cuadrangular | `…?stageId=84n6…` | `84n6…` | `fetchCuadrangularMatchdays()` — **404 el 22 ago**, aún no publicado |

Descubrimiento de `stageId` vía `<standings-competition :filters>` en `/posiciones` (ver `win-sports-api.md` §1). HTML de respaldo en `/posiciones` (tabla `Grupo A/B`) y `/partidos`/`/resultados` (`a[class*="match-"]` + `<format-date :date>`).

---

## 3. Flujo general (`lib/admin/scrapers.ts`)

1. `scrapeWithFallback(scraper)` — intenta HTML (`*-html`) primero; si `isHtmlDataUsable()` falla (vacío o sin `fecha+hora` en matches), usa API. Si API vacía y HTML degradado existe, usa HTML con `warnings`.
2. `buildScraperPreview(rawData, supabase)` — normaliza (`normalizeMatchdays`/`normalizeUpcoming`/`buildStandingsPreview`) resolviendo `teams` y `seasons.is_active`, genera `diff` (create/update/unchanged/skip) y `warnings`.
3. `scraper_runs` guarda `raw_data`, `normalized_data`, `diff`, `summary` en `pending_review`.
4. `shouldAutoApply()` decide si aplicar automático (ver `lib/admin/scraper-automation.ts`); hoy `standings` con 4+4 y `upcoming` sin `fecha` degradado no se auto-aplica.
5. `applyScraperData()` → `lib/save-to-supabase.ts` hace `upsert`.

Guardas clave:
* `isHtmlDataUsable` (`scrapers.ts:115`) — `standings`/`scorers` basta con `length>0`; `matches`/`upcoming` exige `fecha && hora` en todos.
* `shouldAutoApply` no auto-aplica `scheduled` sin fecha/hora.
* `mergeFields` preserva `local_score/away_score/match_date/match_time` si el scraper viene vacío.

---

## 4. Qué persiste cada scraper

### `scripts/scrape-standings.ts` — Tabla regular

* **Fuente:** `GET /api/standings?stageId=85b4…` con fallback `scrapeStandingsHTML()` (`standings-competition table.table` sin `Grupo A/B`).
* **Extrae:** `pos, name, pts, pj, pg, pe, pp, gf, gc, dif`.
* **Guarda:** `saveStandingsToSupabase()` → `teams` (upsert por `slug`) + `standings` (upsert `team_id`). Guarda global (sin `season_id`).
* **Tablas:** `teams`, `standings`.

### `scripts/scrape-stage-standings.ts` — Cuadrangular (Grupo A/B)

* **Fuente:** `fetchStageStandings()` (`84n6…` → 2 grupos A/B) con fallback `scrapeStageStandingsHTML()` (1 tabla 9 `<tr>` o 2 tablas; remapea `pos` 1..4 por grupo).
* **Valida:** `A=4 && B=4` o error.
* **Guarda:** `saveStageStandingsToSupabase()` → `stage_standings` (`season_id, stage='cuadrangular', group_name A/B, team_id`, upsert `season_id,stage,group_name,team_id`).
* **Tablas:** `stage_standings` (RLS public read). Usado por `/api/cuadrangulares/standings` y `/cuadrangulares` (tabs A/B).

### `scripts/scrape-matches.ts` / `scrape-results.ts` — Calendario y resultados regular

* **Fuente API:** `fetchAllMatchdays()` explora `weeks` vía `discoverWeeks()` (past `week=1`, future `14..18`) y une `past+future` sin duplicados.
* **Fuente HTML:** `scrapeMatchCards(RESULTADOS|PARTIDOS)` parsea `a[class*="match-"]`, `header: Fecha N`, `.teams .team .name/.score`, `format-date :date | date | v-bind:date` (Vue) → `fecha/hora` `America/Bogota`.
* **Normaliza:** `normalizeMatchdays(raw, supplier)` deduplica `jornada|local|visitante`, resuelve `team_id`, asigna `phase='regular'`, `status=played/scheduled`.
* **Guarda:** `saveMatchesToSupabase(matchdays, 'regular')` / `saveResultsToSupabase()` (delegan) → `matches` (`season_id, jornada, local_team_id, away_team_id`, upsert; `mergeFields` preserva scores/fechas).
* **Tablas:** `matches` (+ lookup `teams`, `seasons`).

### `scripts/scrape-upcoming.ts` — Próximos regular

* **Fuente:** `fetchUpcomingWeeks()` (`isFuture=true`) + fallback `scrapeUpcomingHTML()` (filtra `golesLocal==null`).
* **Guarda:** `saveUpcomingToSupabase()` → `matches` (`phase='regular'`, `status='scheduled'`, `local_score/away_score=null`).

### `scripts/scrape-scorers.ts` — Goleadoras (Dimayor, no Win)

* **Fuente:** `lib/dimayor-ajax.ts` → `dimayor.com.co` `admin-ajax` con `fetchWithRetry` (403/429/5xx) + rotación de `nonce` (~12h). Solo guarda `photo_uuid`.
* **Guarda:** `saveScorersToSupabase()` → `scorers` (`season_id, player_id`, upsert).
* **Limitación:** Cloudflare bloquea IPs de Vercel; corre **solo** local.

---

## 5. Utilidades

### `lib/save-to-supabase.ts`

* `normalizeTeamName()` para match de `teams` en goleadoras.
* `getExistingMatches()` + `buildMatchKey(season_id|jornada|local|away)` para diff y `mergeFields`.
* `saveStageStandingsToSupabase()` exige temporada activa y `teams` en DB.

### `lib/winsports-api.ts` / `lib/winsports-html.ts`

* `STAGE_ID` regular y `CUADRANGULAR_STAGE_ID` (`84n6…`), `mapTeam`/`NAME_MAP`/`TEAM_MAP_FIXTURES`.
* `fetchWeek(week, isFuture, stageId)` + `discoverWeeks(stageId)` + `parseDate(iso)` → `fecha/hora` Bogota.
* `fetchHTML()` con `User-Agent` Mozilla.
* `cleanName()`, `parseStandingTable()` (skip `name===""` para separador de cuadrangular).

### `lib/admin/scrapers.ts` / `lib/admin/scraper-automation.ts`

* `BASE_SCRAPERS = ["standings","matches","results","upcoming","scorers"]`; variantes `*-html`.
* `SCRAPER_CONFIGS` con `label` y `sourceUrl`.

---

## 6. Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role>
DIMAYOR_COMPETITION_ID=171697   # solo scorers
```

---

## 7. Ejecución local

```bash
pnpm scrape:standings            # regular
pnpm scrape:stage-standings      # cuadrangular A/B (API → HTML)
pnpm scrape:matches              # calendario regular
pnpm scrape:results              # resultados regular
pnpm scrape:upcoming             # próxima fecha
pnpm scrape:cuadrangular-matches # cuadrangulares
pnpm scrape:scorers              # goleadoras
pnpm scrape:all                  # todos en secuencia (scorers puede fallar en cloud)
```

Cada script carga `.env.local` vía `dotenv/config`. Requiere tener temporada activa en `seasons`.

---