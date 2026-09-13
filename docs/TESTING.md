# Test

Suite de pruebas unitarias con [Vitest](https://vitest.dev) (v4). Cubre la lógica que no depende del navegador: mapeo de datos de Win Sports, guardado en Supabase, validaciones con Zod y la orquestación de scrapers del panel admin.

## Estado de la suite

- **11 archivos de test**
- **71 tests**
- Duración aproximada: 9 segundos

## Cómo ejecutar las pruebas

```bash
pnpm test            # ejecuta la suite una vez
pnpm test:watch      # modo watch: reejecuta al editar
pnpm test:coverage   # genera un reporte en /coverage
```

## Configuración

La configuración está en `vitest.config.ts` e incluye:

- Alias `@` hacia la raíz del proyecto, igual que en TypeScript y Next.js.
- Entorno `node`, porque no hay pruebas de UI.
- Todos los archivos `**/*.test.ts`, excepto los directorios `node_modules`, `.next` y `.opencode`.

Las pruebas no acceden a la red ni a Supabase. Cada suite sustituye el `fetch` global o el cliente de Supabase con `vi.stubGlobal` y mocks de módulos.

## Qué cubre cada suite

### 1. `lib/__tests__/winsports-api.test.ts` (10 tests)

Prueba el cliente de la API interna de Win Sports (`lib/winsports-api.ts`), utilizado por los scrapers y por los datos generados durante la compilación.

| Función | Qué valida |
|---|---|
| `mapTeam` | Traduce nombres largos de la API (por ejemplo, "Deportivo Cali" a "Cali") y conserva los nombres desconocidos. |
| `parseDate` | Separa fecha y hora ISO en la zona horaria de Bogotá. |
| `extractJornada` | Extrae el número de jornada de textos como "Fecha 12" y "Fecha 4 - Fase Final". |
| `fetchStandings` | Mapea nombres, normaliza `goalDifference` y lanza un error HTTP cuando la API responde con error. |
| `fetchAllMatchdays` | Agrupa partidos por jornada, ordena las jornadas, mapea marcadores y usa `isFuture=true` cuando corresponde. |
| `fetchUpcomingWeeks` | Lista próximos partidos con su jornada y devuelve `[]` cuando no hay semanas futuras. |

Evita errores de nombres desactualizados, zonas horarias incorrectas, diferencias de gol tratadas como texto y jornadas futuras interpretadas como vacías.

### 2. `lib/__tests__/winsports-html.test.ts` (8 tests)

Prueba los scrapers HTML legados (`lib/winsports-html.ts`) basados en Cheerio.

| Función | Qué valida |
|---|---|
| `scrapeStandingsHTML` | Parsea la tabla de posiciones, asigna posiciones y calcula `dif` cuando no es numérico. |
| `scrapeResultsHTML` | Agrupa por jornada solo partidos con marcador y mapea nombres de equipos. |
| `scrapeUpcomingHTML` | Incluye únicamente partidos sin marcador. |
| `scrapeAllMatchdaysHTML` | Agrupa todos los partidos, con y sin marcador. |

Evita que cambios en el HTML de Win Sports, valores no numéricos o filtros incorrectos pasen inadvertidos.

### 3. `lib/__tests__/save-to-supabase.test.ts` (5 tests)

Prueba el guardado en Supabase (`lib/save-to-supabase.ts`) mediante un mock en memoria.

| Función | Qué valida |
|---|---|
| `mergeFields` | Conserva valores existentes cuando el dato entrante es `null`. |
| `saveStandingsToSupabase` | Hace upsert de equipos y mapea `results` a `team_id`. |
| `saveUpcomingToSupabase` | Crea partidos con `status: scheduled` y preserva marcadores existentes. |
| `saveMatchesToSupabase` | Marca `status: played` cuando hay goles. |

Evita borrar resultados reales al ejecutar el scraper de próximos partidos, guardar standings huérfanos y perder partidos por un `status` incorrecto.

### 4. `lib/__tests__/generate-team-description.test.ts` (3 tests)

Prueba el generador de descripciones SEO de las páginas de equipo. Verifica que incluya posición, puntos y temporada; que mencione una racha de al menos dos victorias; y que no mencione una racha cuando los resultados son mixtos.

Evita meta descriptions con datos falsos o engañosos.

### 5. `lib/validations/__tests__/admin.test.ts` (9 tests)

Prueba los schemas de Zod del admin (`lib/validations/admin.ts`).

| Schema | Qué valida |
|---|---|
| `teamSchema` | Nombre obligatorio, slug en kebab-case, URL válida para `shield_url` y conversión de strings vacíos a `null`. |
| `seasonSchema` | Nombre obligatorio y `is_active` con valor predeterminado `false`. |
| `matchSchema` | Partidos programados sin marcador, marcador completo cuando el partido está jugado, equipos distintos y UUIDs válidos. |
| `validationError` | Formato de errores Zod compatible con la API (`VALIDATION_ERROR`). |

Evita datos inválidos desde el panel admin y errores de validación sin formato en el frontend.

### 6. `lib/admin/__tests__/scrapers.test.ts` (9 tests)

Prueba la orquestación de scrapers del panel administrador (`lib/admin/scrapers.ts`). Verifica los identificadores permitidos, el fallback HTML a API, el enrutamiento hacia el guardador correcto y el diff de la vista previa.

Evita scrapers sin fallback, datos guardados en la tabla o fase equivocada y vistas previas que oculten cambios.

### 7. `lib/admin/__tests__/scraper-automation.test.ts` (6 tests)

Prueba la regla de auto-aplicación (`lib/admin/scraper-automation.ts`), usada por `/api/internal/scrapers/auto`. Verifica que no aplique resultados con errores o sin datos, y que sí aplique resultados sin señales de riesgo.

Evita que una ejecución automática vacía o defectuosa sobrescriba datos válidos.

### 8. `lib/admin/__tests__/api.test.ts` (3 tests)

Prueba los helpers de respuesta de API del admin (`lib/admin/api.ts`). Verifica la construcción de errores con `code`, `status` y `details`, además de la extracción de mensajes desde errores, strings o el fallback.

Evita respuestas inconsistentes entre las rutas del admin.

### 9. `lib/__tests__/dimayor-ajax.test.ts` (5 tests)

Prueba la integración con los endpoints AJAX de Dimayor (`lib/dimayor-ajax.ts`). Verifica la extracción y reintento del nonce, la consulta de fases, el parseo de goleadoras, la normalización de nombres y la construcción de URLs de fotos.

Evita que cambios en las respuestas de Dimayor rompan la carga de fases o la tabla de goleadoras.

### 10. `lib/__tests__/format-date.test.ts` (11 tests)

Prueba el formateo de fechas y horas de partidos (`lib/format-date.ts`), incluidos valores vacíos o inválidos, la zona horaria de Bogotá, el formato de 12 horas y los casos de medianoche y mediodía.

Evita mostrar fechas, horas o separadores incorrectos en el calendario y las páginas de equipo.

### 11. `lib/__tests__/rate-limit.test.ts` (2 tests)

Prueba el límite de solicitudes (`lib/rate-limit.ts`). Verifica que permita solicitudes hasta el límite, bloquee las siguientes y reinicie la ventana cuando expira.

Evita que las rutas protegidas queden sin control de frecuencia o permanezcan bloqueadas después de que termine la ventana.
