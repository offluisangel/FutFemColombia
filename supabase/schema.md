# Schema — Liga Femenina Colombia (Supabase)

## Resumen

| Tabla | Propósito | Escritura |
| --- | --- | --- |
| `teams` | Equipos participantes (nombre, slug, escudo) | Admin |
| `seasons` | Temporadas (una activa a la vez) | Admin |
| `matches` | Partidos del calendario (jornada, marcador, fecha) | Admin |
| `standings` | Tabla de posiciones por equipo | Admin |
| `scraper_runs` | Historial de ejecuciones de scrapers + previews | Admin |
| `stage_standings` | Posiciones por grupo de fase final | Admin |
| `scorers` | Goleadoras por temporada | Admin |
| `admin_audit_log` | Auditoría de acciones del panel admin | Admin |

Todas las tablas tienen **RLS habilitado**: lectura pública (`FOR SELECT USING (true)`) y
escritura restringida a usuarios autenticados (`auth.role() = 'authenticated'`).

## Orden de dependencias

```
teams ─┬─► matches ─► standings
seasons┘      └─► standings (team_id FK)
```

Las claves foráneas exigen crear en este orden: `teams` → `seasons` → `matches`
→ `standings` → `scraper_runs` → `admin_audit_log`.

## Tablas

### teams

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | UUID PK | `gen_random_uuid()` |
| `name` | TEXT | Nombre corto (ej. "Cali") |
| `full_name` | TEXT | Nombre completo (ej. "Deportivo Cali") |
| `slug` | TEXT UNIQUE | Usado en URLs `/equipos/[slug]` |
| `city` | TEXT | Opcional |
| `shield_url` | TEXT | URL del escudo (Opta/Win Sports) |
| `created_at` | TIMESTAMPTZ | `now()` |

### seasons

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | UUID PK | `gen_random_uuid()` |
| `name` | TEXT | Ej. "2026" |
| `is_active` | BOOLEAN | Marca la temporada activa |
| `created_at` | TIMESTAMPTZ | `now()` |

### matches

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | UUID PK | `gen_random_uuid()` |
| `season_id` | UUID FK → seasons | NOT NULL |
| `jornada` | INTEGER | Número de fecha |
| `phase` | TEXT | `'regular'` por defecto (`'cuadrangulares'`/`'semifinal'`/`'final'` según fase) |
| `group_name` / `leg` / `tie_key` | TEXT / INTEGER / TEXT | Metadatos de fase final |
| `local_team_id` | UUID FK → teams | NOT NULL |
| `away_team_id` | UUID FK → teams | NOT NULL |
| `local_score` / `away_score` | INTEGER | NULL si no jugado |
| `match_date` | DATE | |
| `match_time` | TIME | |
| `status` | TEXT | `'scheduled'` / `'played'` |
| `created_at` | TIMESTAMPTZ | `now()` |

**Índices:** `season_id`, `phase`, `match_date`.

**Constraint `matches_unique`:** `UNIQUE (season_id, jornada, local_team_id, away_team_id)`.
Permite el upsert idempotente (`ON CONFLICT`) de los scrapers y evita partidos duplicados.

### standings

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | UUID PK | `gen_random_uuid()` |
| `team_id` | UUID UNIQUE FK → teams | `ON DELETE CASCADE` |
| `pos` | INTEGER | Posición |
| `pts` | INTEGER | Puntos |
| `pj` / `pg` / `pe` / `pp` | INTEGER | Jugados / ganados / empatados / perdidos |
| `gf` / `gc` | INTEGER | Goles a favor / en contra |
| `dif` | INTEGER | Diferencia de gol |

### scraper_runs

Historial y previsualización de scrapers (API y HTML).

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | UUID PK | `gen_random_uuid()` |
| `scraper` | TEXT | Identificador (`standings`, `matches-html`, …) |
| `status` | TEXT | `'pending_review'`, `'applied'`, `'rejected'`, … |
| `source_url` | TEXT | Fuente del dato |
| `started_at` / `finished_at` | TIMESTAMPTZ | |
| `duration_ms` | INTEGER | |
| `triggered_by` | UUID | Usuario admin que disparó la ejecución |
| `summary` | JSONB | Resumen (fetched, creates, updates…) |
| `raw_data` | JSONB | Datos crudos del scraper |
| `normalized_data` | JSONB | Datos normalizados |
| `diff` | JSONB | Diferencia vs. estado actual |
| `warnings` | JSONB | Lista de advertencias |
| `error_message` | TEXT | |
| `applied_at` / `rejected_at` | TIMESTAMPTZ | |
| `rejection_reason` | TEXT | |
| `created_at` | TIMESTAMPTZ | `now()` |

**Índices:** `scraper`, `status`, `created_at DESC`.

### admin_audit_log

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | UUID PK | `gen_random_uuid()` |
| `user_id` | UUID | Usuario que ejecutó la acción |
| `action` | TEXT | Ej. `create`, `update`, `delete` |
| `entity_type` | TEXT | Ej. `team`, `match` |
| `entity_id` | UUID | Registro afectado |
| `before` / `after` | JSONB | Estado antes/después |
| `metadata` | JSONB | `{}` por defecto |
| `created_at` | TIMESTAMPTZ | `now()` |

**Índices:** `created_at DESC`, `(entity_type, entity_id)`.

## RLS

Todas las tablas: lectura pública. Políticas de escritura:

```
CREATE POLICY "Admin write <tabla>" ON <tabla> FOR ALL USING (auth.role() = 'authenticated');
```

`scraper_runs` y `admin_audit_log` además restringen la **lectura** a usuarios
autenticados (no son públicas).

## Notas de uso

- **Proyecto nuevo / base vacía:** ejecutar `schema.sql` completo en el editor
  SQL de Supabase.
- **Proyecto existente:** aplicar las migraciones en orden
  (`00001` → `00002` → `00003` → `00005` → `00006` → `00007`) para reproducir el estado actual sin colisiones.
- Los upserts de `lib/save-to-supabase.ts` dependen de:
  - `teams.slug` (conflicto de upsert de equipos).
  - `matches_unique` (conflicto de upsert de partidos).
  - `standings.team_id` (conflicto de upsert de posiciones).
