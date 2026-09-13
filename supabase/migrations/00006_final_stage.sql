-- Estructura para la fase final de la temporada.
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS group_name TEXT,
  ADD COLUMN IF NOT EXISTS leg INTEGER,
  ADD COLUMN IF NOT EXISTS tie_key TEXT;

ALTER TABLE matches
  ADD CONSTRAINT matches_final_group_check
  CHECK (group_name IS NULL OR group_name IN ('A', 'B'));

ALTER TABLE matches
  ADD CONSTRAINT matches_final_leg_check
  CHECK (leg IS NULL OR leg IN (1, 2));

CREATE INDEX IF NOT EXISTS idx_matches_final_stage
  ON matches(season_id, phase, group_name, tie_key);

CREATE TABLE IF NOT EXISTS stage_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'cuadrangular',
  group_name TEXT NOT NULL,
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
  CONSTRAINT stage_standings_group_check CHECK (group_name IN ('A', 'B')),
  CONSTRAINT stage_standings_unique UNIQUE (season_id, stage, group_name, team_id)
);

CREATE INDEX IF NOT EXISTS idx_stage_standings_lookup
  ON stage_standings(season_id, stage, group_name, pos);

ALTER TABLE stage_standings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read stage standings"
  ON stage_standings FOR SELECT USING (true);
CREATE POLICY "Admin write stage standings"
  ON stage_standings FOR ALL USING (auth.role() = 'authenticated');
