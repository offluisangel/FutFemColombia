# Cómo Contribuir

## Setup

```bash
git clone https://github.com/offluisangel/ligaF.git
cd ligaF
cp .env.example .env   # Configura las variables de entorno
pnpm install
```

## Prioridad actual: diseño del sitio

Las contribuciones que más me interesa recibir ahora son las que mejoran el diseño y la experiencia de uso del sitio. Son especialmente valiosas las propuestas o PRs sobre:

- UI/UX y jerarquía visual
- navegación y flujos para consultar la información
- responsive para móvil y escritorio
- accesibilidad
- visualización de resultados, posiciones, calendario y estadísticas

No hace falta limitarse a estos temas: también son bienvenidos los cambios en datos, scrapers, rendimiento, documentación y mantenimiento. Para cambios visuales grandes, abre primero un issue con la idea o una captura/prototipo para poder discutir el enfoque.

## Comandos

| Comando | Descripción |
|---|---|
| `pnpm dev` | Desarrollo en local (puerto 3000) |
| `pnpm build` | Build de producción |
| `pnpm lint` | Linter |
| `pnpm test` | Ejecutar la suite de pruebas |
| `pnpm test:watch` | Ejecutar pruebas en modo watch |
| `pnpm test:coverage` | Generar el reporte de cobertura |
| `pnpm start` | Servir build de producción |

## Scrapers

Los scrapers leen `.env.local` automáticamente y escriben directamente en la base de datos.
Consulta [`docs/SCRAPERS.md`](./docs/SCRAPERS.md) para la referencia completa.

```bash
pnpm scrape:standings   # Tabla de posiciones
pnpm scrape:matches     # Todos los partidos
pnpm scrape:results     # Resultados
pnpm scrape:upcoming    # Próximos partidos
pnpm scrape:scorers     # Goleadoras (Dimayor) - correr manualmente desde tu computador
pnpm scrape:all         # Todos en secuencia
```

## Arquitectura

```
app/
├── api/
│   ├── standings/        # GET  tabla de posiciones
│   ├── matches/          # GET  calendario completo por jornadas
│   ├── results/          # GET  resultados de partidos jugados
│   ├── upcoming/         # GET  próximos partidos agendados
│   ├── teams/            # GET  lista de equipos
│   ├── stats/            # GET  estadísticas generales de la liga
│   ├── data-status/      # GET  estado de los datos en Supabase
│   ├── admin/            # CRUD de admin (matches, seasons, standings, teams, scrape, scrapers)
│   └── internal/         # Endpoints internos (scrapers/auto, protegidos con Bearer token)
├── admin/
│   ├── login/            # Login de admin
│   ├── logout/           # Logout
│   └── (dashboard)/      # Panel protegido (activity, matches, scrapers, seasons, standings, teams)
├── auth/callback/        # Callback de autenticación Supabase
├── equipos/[slug]/       # Páginas de equipo
├── cuadrangulares/       # Fase final
├── globals.css           # CSS global
├── layout.tsx            # Root layout (fonts, metadata, Open Graph, Twitter Card)
├── page.tsx              # Home (con JSON-LD / Schema.org)
├── manifest.ts           # PWA manifest
├── robots.ts             # Robots.txt
└── sitemap.ts            # Sitemap XML

components/
├── admin/                # Componentes del panel de admin (sidebar, nav, data-table, forms)
├── liga/                 # Componentes de la liga (standings, calendar, cuadrangulares, etc.)
├── ui/                   # Componentes base (shadcn/ui)
└── theme-provider.tsx    # Provider de tema

hooks/
├── use-mobile.ts         # Hook para detectar viewport móvil
└── use-toast.ts          # Hook de toasts (Sonner)

lib/
├── admin/                # Lógica de admin (api, audit, auth, client-errors, scrapers, scraper-automation)
├── supabase/             # Clientes de Supabase (server, client, admin, route-handler, middleware)
├── validations/          # Schemas de Zod (admin.ts)
├── winsports-api.ts      # Cliente de la API interna de Win Sports (standings, matches, upcoming)
├── constants.ts          # URL del sitio
├── generate-team-description.ts  # Generador de descripciones de equipo
├── save-to-supabase.ts   # Lógica de guardado de scrapers
├── timestamp.ts          # Parseo de fechas
└── utils.ts              # Utilidades generales (cn, etc.)

scripts/                  # Scrapers y utilidades
styles/                   # CSS global (importado desde app/layout.tsx)
supabase/migrations/      # Migraciones de Supabase
.github/workflows/        # CI (build en PRs) + scrapers auto (diario)
middleware.ts             # Auth middleware (protege rutas /admin y /api/admin)
```

## Reportar bugs

1. Abre un [issue](https://github.com/offluisangel/ligaF/issues)
2. Describe qué esperabas vs qué ocurrió

Para propuestas de diseño, incluye el contexto del problema, la pantalla o flujo afectado y, si es posible, una captura, boceto o enlace a una referencia.

## Enviar un PR

1. Crea un branch con nombre descriptivo
2. Haz commits claros
3. Ejecuta `pnpm lint` y `pnpm test`
4. Push y abre el PR

## ¿No sabes por dónde empezar?

[Revisa los issues](https://github.com/offluisangel/ligaF/issues)
