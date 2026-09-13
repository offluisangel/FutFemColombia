# Scrapers

Todos los scrapers leen credenciales desde `.env.local`. Asegúrate de tenerlo antes de correr cualquiera.

## Requisitos en `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
DIMAYOR_COMPETITION_ID=171697   # solo para scorers
```

---

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm scrape:standings` | Tabla de posiciones (Win Sports) |
| `pnpm scrape:matches` | Calendario completo (Win Sports) |
| `pnpm scrape:results` | Resultados de partidos (Win Sports) |
| `pnpm scrape:upcoming` | Próximos partidos (Win Sports) |
| `pnpm scrape:scorers` | Goleadoras (Dimayor) — **unico que toca correr manualmente** |
| `pnpm scrape:all` | Todos los anteriores en secuencia |
| `pnpm scrape:stage-standings` | Posiciones de la fase final (Win Sports) |
| `pnpm scrape:cuadrangular-matches` | Partidos del cuadrangular (Win Sports) |
---

- Para apuntar a una competición diferente (nueva temporada), añade a `.env.local`:

```env
DIMAYOR_COMPETITION_ID=<nuevo-id>
```

---