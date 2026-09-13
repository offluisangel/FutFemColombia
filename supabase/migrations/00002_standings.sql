-- Standings
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

ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read standings" ON standings FOR SELECT USING (true);
CREATE POLICY "Admin write standings" ON standings FOR ALL USING (auth.role() = 'authenticated');

-- UNIQUE constraint for matches upsert
ALTER TABLE matches ADD CONSTRAINT matches_unique UNIQUE (season_id, jornada, local_team_id, away_team_id);
