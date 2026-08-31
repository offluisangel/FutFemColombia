<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build" />
  <img src="https://img.shields.io/badge/license-AGPL--v3-blue" alt="License" />
  <img src="https://img.shields.io/badge/data-scraped-orange" alt="Data" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs" />
</p>

# ⚽ Liga Femenina Colombia

**Portal open-source para seguir la Liga Femenina Colombiana.**
Resultados en vivo, clasificación actualizada y calendario completo, todo en un solo lugar.

🌐 **Sitio web:** [futfemcolombia.site](https://futfemcolombia.site)

---

## El Problema

La Liga Femenina Colombiana no tiene una API pública ni un portal centralizado donde consultar:

- **Sin API oficial.** No existe un endpoint público para obtener resultados, posiciones o calendario.
- **Datos dispersos.** La información está repartida entre Win Sports, Dimayor, y sitios de terceros con distinta calidad y actualización.
- **Poca visibilidad.** A diferencia de la liga masculina, hay menos herramientas, apps y sitios dedicados al fútbol femenino colombiano.

---

## La Solución

Un pipeline automatizado que:

1. **Scrapea** fuentes oficiales (Win Sports) mediante GitHub Actions.
2. **Estructura** los datos y los guarda en **Supabase**.
3. **Sirve** una API REST propia y una interfaz web moderna con **Next.js**.

```
Win Sports ──▶ Scrapers ──▶ Supabase (Postgres) ──▶ API Routes ──▶ Next.js Frontend
                   ▲
            GitHub Actions
           (cada 24 horas)
```

Los datos se actualizan automáticamente todos los días.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Framer Motion |
| UI | Radix UI, shadcn/ui, Lucide icons, Sonner (toasts) |
| Database | Supabase (Postgres) con Row Level Security |
| Auth | Supabase SSR (`@supabase/supabase-js` + `@supabase/ssr`) |
| API | Next.js Route Handlers (`app/api/*`) |
| Scraping | API interna de Win Sports (`lib/winsports-api.ts`) |
| Validación | Zod |
| Admin | Panel integrado en `/admin` con auth, CRUD y triggers de scrapers |
| CI/CD | GitHub Actions (build en PRs + scrapers automáticos diarios) |

---

## Features

- [x] **Clasificación** — Tabla de posiciones con estadísticas completas (PJ, PG, PE, PP, GF, GC, DIF, PTS).
- [x] **Calendario interactivo** — Navegación por jornadas con flechas, muestra resultados de partidos ya jugados y fecha/hora de los próximos.
- [x] **Próximos partidos** — Vista de la siguiente jornada con detalles.
- [x] **Páginas de equipo** — Vista detallada con resultados recientes y próximos partidos.
- [x] **Fase Final** — Página de cuadrangulares con estructura del formato real.
- [x] **Estadísticas generales** — Endpoint con resumen de equipos, partidos jugados y goles totales.
- [x] **API REST** — Endpoints públicos para standings, matches, results, upcoming, teams y stats.
- [x] **Auto-actualización** — GitHub Actions scrapea y actualiza Supabase cada 24h.
- [x] **Scrapers** — Extracción automatizada desde Win Sports (API interna).
- [x] **Panel admin** — CRUD de equipos, partidos, temporadas y posiciones + trigger de scrapers + historial de ejecuciones.
- [x] **Auth** — Login de admin protegido con Supabase SSR + middleware.
- [x] **SEO** — JSON-LD (Schema.org), Open Graph, Twitter Cards, sitemap, robots.txt, PWA manifest.
- [x] **CI** — Build automático en pull requests.

---

## Cómo Contribuir

Todas las contribuciones son bienvenidas.

En este momento, las contribuciones que más me interesan son las relacionadas con el **diseño y la experiencia del sitio**: mejoras de UI/UX, navegación, responsive, accesibilidad y visualización de la información de la liga. También son bienvenidos los cambios en scrapers, datos, rendimiento, documentación y mantenimiento.

### Áreas donde puedes ayudar

- **Diseñar y mejorar el sitio.** Propuestas y PRs que hagan más clara, útil y atractiva la experiencia de consultar resultados, posiciones, calendario y páginas de equipo.
- **Mantener scrapers.** Si Win Sports cambia su API, los scrapers se rompen. Actualizarlos ayuda a mantener los datos correctos.
- **Nuevas fuentes de datos.** ¿Encontraste otro sitio con datos de la Liga F? Agregar un scraper nuevo siempre suma.
- **Frontend.** Accesibilidad, rendimiento y nuevas secciones, además de mejoras visuales.
- **Documentación.** El README, guías de uso, etc.

Lee [`CONTRIBUTING.md`](./CONTRIBUTING.md) para más detalles.

---

## API

Endpoints públicos disponibles en `/api/*`:

| Endpoint | Descripción |
|---|---|
| `GET /api/standings` | Tabla de posiciones |
| `GET /api/matches` | Calendario completo por jornadas (con resultados si están disponibles) |
| `GET /api/results` | Resultados de partidos jugados |
| `GET /api/upcoming` | Próximos partidos agendados |
| `GET /api/teams` | Lista de equipos (nombre, slug, escudo) |
| `GET /api/stats` | Estadísticas generales (equipos, partidos jugados, goles, jornada actual) |

Ejemplo:

```bash
curl https://futfemcolombia.site/api/standings
```

---

## Estructura del proyecto

```
app/
├── api/              # API Routes (públicas + admin + internas)
├── admin/            # Panel de administración (protegido con auth)
├── auth/             # Callback de autenticación
├── equipos/[slug]/   # Páginas de equipo
├── cuadrangulares/   # Fase final
└── page.tsx          # Home (con JSON-LD / Schema.org)

components/
├── admin/            # UI del panel de admin
├── liga/             # Componentes específicos de la liga
└── ui/               # Componentes base (shadcn/ui)

hooks/                # Custom hooks (use-mobile, use-toast)
lib/
├── admin/            # Lógica de admin (api, auth, audit, scrapers)
├── supabase/         # Clientes de Supabase (server, client, admin, middleware)
├── validations/      # Schemas de Zod
└── winsports-api.ts  # Cliente de la API de Win Sports

scripts/              # Scrapers y utilidades
supabase/schema.sql   # Esquema definitivo (fuente única, ver supabase/schema.md)
supabase/migrations/  # Migraciones históricas de Supabase
.github/workflows/    # CI + scrapers automáticos
```

---

## Proyectos similares

Si trabajas en herramientas para otras ligas o datos deportivos, [abre un issue](https://github.com/offluisangel/ligaF/issues) y lo linkeamos.

---

## Licencia

[GNU AGPL v3](./LICENSE) — cualquier fork que se despliegue como servicio web debe publicar su código fuente.
