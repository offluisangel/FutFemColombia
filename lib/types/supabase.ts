export type Team = {
  id: string;
  name: string;
  full_name: string;
  slug: string;
  city: string | null;
  shield_url: string | null;
  created_at?: string;
};

export type Season = {
  id: string;
  name: string;
  is_active: boolean;
  created_at?: string;
};

export type Match = {
  id: string;
  season_id: string;
  jornada: number | null;
  phase: string;
  group_name: string | null;
  leg: number | null;
  tie_key: string | null;
  local_team_id: string;
  away_team_id: string;
  local_score: number | null;
  away_score: number | null;
  match_date: string | null;
  match_time: string | null;
  status: "scheduled" | "played" | string;
  created_at?: string;
};

export type Standing = {
  id: string;
  team_id: string;
  pos: number;
  pts: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
};

export type StageStanding = Standing & {
  season_id: string;
  stage: string;
  group_name: string;
  updated_at: string;
};

export type Scorer = {
  id: string;
  season_id: string;
  player_id: number;
  name: string;
  team_id: string | null;
  team_name: string | null;
  goals: number;
  photo_uuid: string | null;
  pos: number;
  created_at?: string;
  updated_at?: string;
};

export type ScraperSummary = {
  source?: string;
  fetched?: number;
  creates?: number;
  updates?: number;
  total?: number;
  created?: number;
  updated?: number;
  removed?: number;
  errors?: number;
  warnings?: number;
  [key: string]: unknown;
};

export type DiffItem = {
  type?: string;
  entity?: string;
  key?: string;
  label?: string;
  reason?: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  notes?: string[];
  before?: unknown;
  after?: unknown;
  [key: string]: unknown;
};

export type ScraperRun = {
  id: string;
  scraper: string;
  status: string;
  source_url: string | null;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  triggered_by: string | null;
  summary: ScraperSummary;
  raw_data: unknown;
  normalized_data: unknown;
  diff: DiffItem[] | null;
  warnings: string[];
  error_message: string | null;
  applied_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
};

export type AdminAuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before: unknown;
  after: unknown;
  metadata: Record<string, unknown>;
  created_at: string;
};
