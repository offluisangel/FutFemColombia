-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city TEXT,
  shield_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seasons
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id),
  jornada INTEGER,
  phase TEXT DEFAULT 'regular',
  local_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  local_score INTEGER,
  away_score INTEGER,
  match_date DATE,
  match_time TIME,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_matches_season ON matches(season_id);
CREATE INDEX idx_matches_phase ON matches(phase);
CREATE INDEX idx_matches_date ON matches(match_date);

-- RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);

CREATE POLICY "Admin write teams" ON teams FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write seasons" ON seasons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write matches" ON matches FOR ALL USING (auth.role() = 'authenticated');
