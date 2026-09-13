-- Admin operation history and scraper previews
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

ALTER TABLE scraper_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read scraper runs" ON scraper_runs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write scraper runs" ON scraper_runs FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin read audit log" ON admin_audit_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write audit log" ON admin_audit_log FOR ALL USING (auth.role() = 'authenticated');
