-- ============================================================================
-- Schema definitivo — Liga Femenina Colombia
-- ============================================================================
-- Fuente única del esquema de Supabase (Postgres).
--
-- CONSIDERACIONES
--  * Este archivo consolida las migraciones 00001_init, 00002_standings y
--    00003_admin_operations (que se conservan en supabase/migrations/ como
--    historial de la evolución del esquema).
--  * Está ordenado por dependencias: equipos -> temporadas -> partidos ->
--    posiciones -> scrapers/auditoría. Respeta las claves foráneas.
--  * RLS está habilitado en todas las tablas: lectura pública, escritura
--    solo para usuarios autenticados (admin).
--
-- CÓMO USARLO
--  1. Abre el editor SQL de Supabase (mismo proyecto).
--  2. Ejecuta este archivo completo (Create new snippet -> Run).
--  3. Es idempotente solo si la base está vacía; en un proyecto existente se
--     debe aplicar migración por migración (ver supabase/migrations/).
--
-- Ver documentación detallada en supabase/schema.md.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. TEAMS
-- ---------------------------------------------------------------------------
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city TEXT,
  shield_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. SEASONS
-- ---------------------------------------------------------------------------
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. MATCHES
-- ---------------------------------------------------------------------------
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id),
  jornada INTEGER,
  phase TEXT DEFAULT 'regular',
  group_name TEXT,
  leg INTEGER,
  tie_key TEXT,
  local_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  local_score INTEGER,
  away_score INTEGER,
  match_date DATE,
  match_time TIME,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Clave única para el upsert de partidos (evita duplicados por jornada).
  CONSTRAINT matches_unique UNIQUE (season_id, jornada, local_team_id, away_team_id)
);

CREATE INDEX idx_matches_season ON matches(season_id);
CREATE INDEX idx_matches_phase ON matches(phase);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_final_stage ON matches(season_id, phase, group_name, tie_key);

-- ---------------------------------------------------------------------------
-- 4. STAGE_STANDINGS
-- ---------------------------------------------------------------------------
CREATE TABLE stage_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'cuadrangular',
  group_name TEXT NOT NULL CHECK (group_name IN ('A', 'B')),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  pos INTEGER NOT NULL,
  pts INTEGER NOT NULL DEFAULT 0,
  pj INTEGER NOT NULL DEFAULT 0,
  pg INTEGER NOT NULL DEFAULT 0,
  pe INTEGER NOT NULL DEFAULT 0,
  pp INTEGER NOT NULL DEFAULT 0,
  gf INTEGER NOT NULL DEFAULT 0,
  gc INTEGER NOT NULL DEFAULT 0,
  dif INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, stage, group_name, team_id)
);

CREATE INDEX idx_stage_standings_lookup ON stage_standings(season_id, stage, group_name, pos);

-- ---------------------------------------------------------------------------
-- 5. SCORERS
-- ---------------------------------------------------------------------------
CREATE TABLE scorers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  team_name TEXT,
  goals INTEGER NOT NULL DEFAULT 0,
  photo_uuid TEXT,
  pos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (season_id, player_id)
);

CREATE INDEX idx_scorers_season_pos ON scorers(season_id, pos);

-- ---------------------------------------------------------------------------
-- 5. STANDINGS
-- ---------------------------------------------------------------------------
CREATE TABLE standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID UNIQUE NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  pos INTEGER NOT NULL,
  pts INTEGER NOT NULL DEFAULT 0,
  pj INTEGER NOT NULL DEFAULT 0,
  pg INTEGER NOT NULL DEFAULT 0,
  pe INTEGER NOT NULL DEFAULT 0,
  pp INTEGER NOT NULL DEFAULT 0,
  gf INTEGER NOT NULL DEFAULT 0,
  gc INTEGER NOT NULL DEFAULT 0,
  dif INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- 6. SCRAPER_RUNS (historial de ejecuciones y previsualizaciones)
-- ---------------------------------------------------------------------------
CREATE TABLE scraper_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scraper TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review',
  source_url TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  triggered_by UUID,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_data JSONB,
  normalized_data JSONB,
  diff JSONB,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message TEXT,
  applied_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scraper_runs_scraper ON scraper_runs(scraper);
CREATE INDEX idx_scraper_runs_status ON scraper_runs(status);
CREATE INDEX idx_scraper_runs_created_at ON scraper_runs(created_at DESC);

-- ---------------------------------------------------------------------------
-- 7. ADMIN_AUDIT_LOG (auditoría de acciones del panel admin)
-- ---------------------------------------------------------------------------
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before JSONB,
  after JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_entity ON admin_audit_log(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
--    Lectura pública; escritura solo para usuarios autenticados (admin).
-- ---------------------------------------------------------------------------
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorers ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read standings" ON standings FOR SELECT USING (true);
CREATE POLICY "Public read stage standings" ON stage_standings FOR SELECT USING (true);
CREATE POLICY "Public read scorers" ON scorers FOR SELECT USING (true);
CREATE POLICY "Admin read scraper runs" ON scraper_runs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin read audit log" ON admin_audit_log FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin write teams" ON teams FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write seasons" ON seasons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write matches" ON matches FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write standings" ON standings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write stage standings" ON stage_standings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write scorers" ON scorers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write scraper runs" ON scraper_runs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write audit log" ON admin_audit_log FOR ALL USING (auth.role() = 'authenticated');