-- Public data tables: preserve public SELECT and restrict all writes to admins.
DROP POLICY IF EXISTS "Public read teams" ON teams;
DROP POLICY IF EXISTS "Admin write teams" ON teams;
CREATE POLICY "Public read teams" ON teams
  FOR SELECT USING (true);
CREATE POLICY "Admin write teams" ON teams
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Public read seasons" ON seasons;
DROP POLICY IF EXISTS "Admin write seasons" ON seasons;
CREATE POLICY "Public read seasons" ON seasons
  FOR SELECT USING (true);
CREATE POLICY "Admin write seasons" ON seasons
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Public read matches" ON matches;
DROP POLICY IF EXISTS "Admin write matches" ON matches;
CREATE POLICY "Public read matches" ON matches
  FOR SELECT USING (true);
CREATE POLICY "Admin write matches" ON matches
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Public read standings" ON standings;
DROP POLICY IF EXISTS "Admin write standings" ON standings;
CREATE POLICY "Public read standings" ON standings
  FOR SELECT USING (true);
CREATE POLICY "Admin write standings" ON standings
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Public read stage standings" ON stage_standings;
DROP POLICY IF EXISTS "Admin write stage standings" ON stage_standings;
CREATE POLICY "Public read stage standings" ON stage_standings
  FOR SELECT USING (true);
CREATE POLICY "Admin write stage standings" ON stage_standings
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Public read scorers" ON scorers;
DROP POLICY IF EXISTS "Admin write scorers" ON scorers;
CREATE POLICY "Public read scorers" ON scorers
  FOR SELECT USING (true);
CREATE POLICY "Admin write scorers" ON scorers
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Administrative tables: restrict both reads and writes to admins.
DROP POLICY IF EXISTS "Admin read scraper runs" ON scraper_runs;
DROP POLICY IF EXISTS "Admin write scraper runs" ON scraper_runs;
CREATE POLICY "Admin read scraper runs" ON scraper_runs
  FOR SELECT USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admin write scraper runs" ON scraper_runs
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin read audit log" ON admin_audit_log;
DROP POLICY IF EXISTS "Admin write audit log" ON admin_audit_log;
CREATE POLICY "Admin read audit log" ON admin_audit_log
  FOR SELECT USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admin write audit log" ON admin_audit_log
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
