# Win Sports — API Interna (Liga Femenina)

Documentación de la API no oficial de **winsports.co** usada por FutFemColombia para posiciones y calendario de la Liga Femenina BetPlay. Descubierta inspeccionando el tráfico del componente Vue `<matches-competition>` y el custom element `<standings-competition>`.

> **Base:** `https://www.winsports.co` · Sin API key · Pública, sujeta a cambios sin aviso. Verificado el **22 ago 2026**.

---

## 1. Descubrimiento de `stageId`

Cada temporada expone sus etapas en el HTML de `/posiciones` dentro del atributo `:filters` de `<standings-competition>`:

```html
<standings-competition :filters="{&quot;id&quot;:&quot;42o80ym7olnzmkodx1xei75d5&quot;,...,&quot;tournaments&quot;:[{&quot;id&quot;:&quot;83kdbq9vm8avqornousxg4nx0&quot;,&quot;name&quot;:&quot;2026&quot;,&quot;standingStages&quot;:[{&quot;stages&quot;:[{&quot;id&quot;:&quot;84n6bl7fg3hut5al91qnc9ams&quot;,&quot;name&quot;:&quot;Semifinales&quot;},{&quot;id&quot;:&quot;85b4l7dazn8mc4fivur3lkb2s&quot;,&quot;name&quot;:&quot;Etapa de Grupos&quot;}]}]}]}">
```

IDs útiles:

| Competición | `competitionId` | Torneo | `tournamentId` | Etapa | `stageId` | Descubrimiento |
|---|---|---|---|---|---|---|
| Liga Femenina | `42o80ym7olnzmkodx1xei75d5` | 2026 | `83kdbq9vm8avqornousxg4nx0` | Etapa de Grupos (regular) | `85b4l7dazn8mc4fivur3lkb2s` | `standingStages[0]` |
| Liga Femenina | `42o80ym7olnzmkodx1xei75d5` | 2026 | `83kdbq9vm8avqornousxg4nx0` | Semifinales / Cuadrangulares | `84n6bl7fg3hut5al91qnc9ams` | `standingStages[1]` |

> Para 2025/2024 los IDs cambian — inspeccionar el mismo atributo. No hay endpoint de listado oficial.

---

## 2. Endpoints

### 2.1 Posiciones

```
GET https://www.winsports.co/api/standings?stageId={stageId}
Headers: User-Agent: Mozilla/5.0 (...)
```

**Parámetros**

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `stageId` | string | sí | ID de etapa (ver §1) |

**Comportamiento por etapa**

* `85b4l7dazn8mc4fivur3lkb2s` (regular): `standings` con **1** objeto, `ranking` de 12 equipos.
* `84n6bl7fg3hut5al91qnc9ams` (cuadrangular): `standings` con **2** objetos, `groupName: "Grupo A"` y `"Grupo B"`, 4 equipos cada uno. Verificado 22 ago 2026 — todos `pts=0` al inicio de la fase.

**Respuesta — regular (1 grupo)**

```json
{
  "standings": [
    {
      "id": "85b4l7dazn8mc4fivur3lkb2s_total",
      "groupName": null,
      "name": "Etapa de Grupos",
      "stageId": "85b4l7dazn8mc4fivur3lkb2s",
      "type": "Posiciones",
      "competitionId": "42o80ym7olnzmkodx1xei75d5",
      "tournamentId": "83kdbq9vm8avqornousxg4nx0",
      "ranking": [
        {
          "rank": 1,
          "contestantId": "5uco0umjsksdsswvjj0t43tyi",
          "optaId": 14185,
          "contestantName": "Club Atlético Nacional SA",
          "contestantShortName": "Atl. Nacional",
          "contestantCode": "NAC",
          "points": 39,
          "matchesPlayed": 16,
          "matchesWon": 13,
          "matchesDrawn": 0,
          "matchesLost": 3,
          "goalsFor": 34,
          "goalsAgainst": 9,
          "goalDifference": "+25",
          "lastRank": 1,
          "lastSix": "WLWWWW"
        }
      ]
    }
  ]
}
```

**Respuesta — cuadrangular (2 grupos)**

```json
{
  "standings": [
    {
      "id": "84n6bl7fg3hut5al91qnc9ams_total_grupo-a",
      "groupName": "Grupo A",
      "name": "Semifinales",
      "stageId": "84n6bl7fg3hut5al91qnc9ams",
      "ranking": [
        { "rank": 1, "contestantShortName": "Atl. Nacional", "points": 0, "matchesPlayed": 0, "goalsFor": 0, "goalsAgainst": 0, "goalDifference": "0" },
        { "rank": 2, "contestantShortName": "Inter Bogotá", "points": 0, "matchesPlayed": 0 },
        { "rank": 3, "contestantShortName": "Inter Palmira", "points": 0 },
        { "rank": 4, "contestantShortName": "Millonarios", "points": 0 }
      ]
    },
    {
      "id": "84n6bl7fg3hut5al91qnc9ams_total_grupo-b",
      "groupName": "Grupo B",
      "ranking": [
        { "rank": 1, "contestantShortName": "América", "points": 0 },
        { "rank": 2, "contestantShortName": "Cali", "points": 0 },
        { "rank": 3, "contestantShortName": "Santa Fe", "points": 0 },
        { "rank": 4, "contestantShortName": "Orsomarso", "points": 0 }
      ]
    }
  ]
}
```

**Campos `ranking[]`**

| Campo | Tipo | Notas |
|---|---|---|
| `rank` | number | Posición en el grupo |
| `contestantShortName` | string | Nombre corto Opta — requiere mapeo a DB local |
| `contestantName` / `contestantCode` | string | Largo / código |
| `points`, `matchesPlayed/Won/Drawn/Lost` | number | — |
| `goalsFor`, `goalsAgainst`, `goalDifference` | number/string | `"+25"` → parsear |
| `optaId` | number | Para escudo: `omo.akamai.opta.net/image.php?...&entity=team&dimensions=65&id={optaId}` |
| `lastSix` | string/null | `null` al inicio de cuadrangular |

**Errores:** `200` siempre si `stageId` válido; `404` si etapa sin tabla publicada.

---

### 2.2 Partidos

```
GET https://www.winsports.co/api/matches/competition?stageId={stageId}&week={week}&isFuture={boolean}
Headers: User-Agent: Mozilla/5.0 (...)
```

**Parámetros**

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `stageId` | string | sí | Ver §1 |
| `week` | number | sí | Jornada 1-based. Regular: 1..16. Cuadrangular: 1..6 (cuando exista) |
| `isFuture` | boolean | sí | `false` = jugados/resultados, `true` = programados. Estricto: enviar `true`/`false` en minúsculas |


**Respuesta — con partidos**

```json
{
  "matches": [
    {
      "id": "cdimjw5kpn2jrcd1kryvjbd3o",
      "header": "Fecha 1",
      "date": "2026-02-18T22:00:00+00:00",
      "matchStatus": "Played",
      "home": {
        "name": "Llaneros",
        "shortName": "Llaneros",
        "code": "LLA",
        "optaId": 17059,
        "isWinner": true,
        "scores": { "ft": 2, "et": null, "pen": null, "aggregate": null },
        "url": "/futbol-colombiano/equipos/llaneros-femenino"
      },
      "away": {
        "name": "Deportivo Pasto",
        "shortName": "Pasto",
        "code": "PAS",
        "optaId": 12600,
        "isWinner": false,
        "scores": { "ft": 0, "et": null, "pen": null, "aggregate": null }
      }
    }
  ],
  "weeks": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
}
```

**Respuesta — vacío / 404**

```json
{ "type": "https://tools.ietf.org/html/rfc9110#section-15.5.5", "title": "Not Found", "status": 404, "traceId": "00-..." }
```

**Campos**

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | ID Opta |
| `header` | string | `"Fecha N"` |
| `date` | string ISO | UTC, convertir a `America/Bogota` |
| `home/away.name` | string | Nombre Opta — mapear |
| `home/away.scores.ft` | number/null | `null` si no jugado |
| `weeks` | number[] | Semanas disponibles para ese `stageId`/`isFuture` |

---

## 3. HTML como respaldo

Cuando la API no publica, el HTML de `winsports.co` es la fuente:

| Página | Estado 22 ago | Selector | Notas |
|---|---|---|---|
| `/futbol-colombiano/liga-femenina/posiciones` | ✅ tabla Grupo A/B | `standings-competition table.table` | 1 tabla, 9 `<tr>` (8 válidas + separador). Parser remapea `pos` 1..4 por grupo |
| `/futbol-colombiano/liga-femenina/partidos` | ❌ solo `<div class="news">` | `a[class*="match-"]` + `format-date :date` | 0 partidos cuadrangular hoy |
| `/futbol-colombiano/liga-femenina/resultados` | ✅ solo regular | idem | 2 `matches-competition` con `stageId` regular |

Ver `lib/winsports-html.ts:105` (`scrapeStageStandingsHTML`) y `lib/winsports-html.ts:221` (`scrapeCuadrangularMatchesHTML` con `inferGroup`).

---

## 4. Mapeo de equipos

Opta usa nombres largos; DB local usa cortos:

```ts
const TEAM_NAME_MAP: Record<string, string> = {
  "Internacional Palmira": "Inter Palmira",
  "Internacional de Bogotá": "Inter de Bogotá",
  "Independiente Santa Fe": "Santa Fe",
  "Deportivo Cali": "Cali",
  "Independiente Medellín": "Medellín",
  "América de Cali": "América",
  "Atlético Nacional": "Atl. Nacional",
  "Deportivo Pasto": "Pasto",
  "Atlético Bucaramanga": "Bucaramanga",
}
```

Aplicado en `mapTeam()` y `NAME_MAP`/`TEAM_MAP_FIXTURES` para standings y fixtures. Añadir nuevos alias cuando aparezcan.

---

## 6. Notas de operación

* **Sin auth.** Solo `User-Agent` tipo navegador. Respeta `200ms` entre `week`s para no saturar.
* **Zona horaria.** `date` viene UTC; convertir con `America/Bogota` (`lib/winsports-api.ts:22` `parseDate`).
* **isFuture estricto.** Enviar `isFuture=false` para resultados (`scores.ft` con valor) y `true` para programados (`null`).
* **Escudos.** `https://omo.akamai.opta.net/image.php?secure=true&sport=football&entity=team&description=badges&dimensions=65&id={optaId}`.

---
