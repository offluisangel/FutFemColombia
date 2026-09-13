CREATE TABLE IF NOT EXISTS scorers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  team_name TEXT,
  goals INTEGER NOT NULL DEFAULT 0,
  played INTEGER NOT NULL DEFAULT 0,
  photo_uuid TEXT,
  pos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (season_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_scorers_season_pos ON scorers(season_id, pos);
ALTER TABLE scorers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read scorers" ON scorers FOR SELECT USING (true);
CREATE POLICY "Admin write scorers" ON scorers FOR ALL USING (auth.role() = 'authenticated');
