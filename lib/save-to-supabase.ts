import type { SupabaseClient } from "@supabase/supabase-js";
import type { Scorer } from "@/lib/dimayor-ajax";

interface Standing {
  pos: number;
  name: string;
  pts: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
}

interface Match {
  local: string;
  visitante: string;
  fecha?: string;
  hora: string;
  golesLocal?: number;
  golesVisitante?: number;
}

interface Matchday {
  jornada: number;
  fecha: string;
  partidos: Match[];
}

interface UpcomingMatch {
  local: string;
  visitante: string;
  fecha: string;
  hora: string;
  jornada: number;
}

function normalizeTeamName(value: string) {
  return value.toUpperCase().replace(/[.\s]/g, "");
}

export async function saveScorersToSupabase(
  scorers: Scorer[],
  supabase: SupabaseClient,
) {
  const [{ data: season }, { data: teams }] = await Promise.all([
    supabase.from("seasons").select("id").eq("is_active", true).single(),
    supabase.from("teams").select("id, name"),
  ]);
  if (!season) throw new Error("No active season found");

  const aliases: Record<string, string> = {
    INDSANTAFE: "INDEPENDIENTESANTAFE",
    SANTAFE: "INDEPENDIENTESANTAFE",
  };
  const teamsByName = new Map(
    (teams ?? []).map((team) => [normalizeTeamName(team.name), team]),
  );
  const rows = scorers.map((scorer) => {
    const normalized = normalizeTeamName(scorer.team_name);
    const team = teamsByName.get(normalized) ?? teamsByName.get(aliases[normalized]);
    return {
      season_id: season.id,
      player_id: scorer.player_id,
      name: scorer.name,
      team_id: team?.id ?? null,
      team_name: scorer.team_name,
      goals: scorer.goals,
      photo_uuid: scorer.photo_uuid,
      pos: scorer.pos,
    };
  });

  const { error } = await supabase.from("scorers").upsert(rows, {
    onConflict: "season_id,player_id",
  });
  if (error) throw new Error(`Error saving scorers: ${error.message}`);
  console.log(`Saved ${rows.length} scorers to Supabase`);
}

export async function saveStandingsToSupabase(
  standings: Standing[],
  supabase: SupabaseClient,
) {
  const { data: existingTeams } = await supabase
    .from("teams")
    .select("id, name, full_name, slug, city, shield_url");

  const existingMap = new Map((existingTeams ?? []).map((t) => [t.name, t]));

  const teams = standings.map((s) => {
    const existing = existingMap.get(s.name);
    return {
      name: s.name,
      full_name: existing?.full_name ?? s.name,
      slug: existing?.slug ?? s.name.toLowerCase().replace(/\s+/g, "-"),
      city: existing?.city ?? null,
      shield_url: existing?.shield_url ?? null,
    };
  });

  const { data: dbTeams, error: teamErr } = await supabase
    .from("teams")
    .upsert(teams, { onConflict: "slug" })
    .select();

  if (teamErr) throw new Error(`Error saving teams: ${teamErr.message}`);
  console.log(`Saved ${teams.length} teams to Supabase`);

  const teamIds = Object.fromEntries(
    (dbTeams ?? []).map((t: { name: string; id: string }) => [t.name, t.id]),
  );

  const standingsRows = standings
    .map((s) => ({
      team_id: teamIds[s.name],
      pos: s.pos,
      pts: s.pts,
      pj: s.pj,
      pg: s.pg,
      pe: s.pe,
      pp: s.pp,
      gf: s.gf,
      gc: s.gc,
      dif: s.dif,
    }))
    .filter((s) => s.team_id);

  const { error: sErr } = await supabase
    .from("standings")
    .upsert(standingsRows, { onConflict: "team_id" });

  if (sErr) throw new Error(`Error saving standings: ${sErr.message}`);
  console.log(`Saved ${standingsRows.length} standings rows to Supabase`);
}

export type StageStandings = { A: Standing[]; B: Standing[] };

export async function saveStageStandingsToSupabase(
  stageStandings: StageStandings,
  supabase: SupabaseClient,
) {
  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .single();
  if (!season) throw new Error("No active season found");

  const { data: teams } = await supabase.from("teams").select("id, name");
  if (!teams) throw new Error("No teams found in DB");
  const teamMap = new Map(teams.map((team) => [team.name, team.id]));
  const rows = (Object.entries(stageStandings) as ["A" | "B", Standing[]][]).flatMap(
    ([group, standings]) => standings.flatMap((standing) => {
      const teamId = teamMap.get(standing.name);
      if (!teamId) {
        console.warn(`Skipping ${standing.name} - team not found`);
        return [];
      }
      return [{
        season_id: season.id,
        stage: "cuadrangular",
        group_name: group,
        team_id: teamId,
        pos: standing.pos,
        pts: standing.pts,
        pj: standing.pj,
        pg: standing.pg,
        pe: standing.pe,
        pp: standing.pp,
        gf: standing.gf,
        gc: standing.gc,
        dif: standing.dif,
        updated_at: new Date().toISOString(),
      }];
    }),
  );
  if (!rows.length) throw new Error("No stage standings to save");
  const { error: deleteError } = await supabase
    .from("stage_standings")
    .delete()
    .eq("season_id", season.id)
    .eq("stage", "cuadrangular");
  if (deleteError) throw new Error(`Error clearing stage standings: ${deleteError.message}`);
  const { error } = await supabase.from("stage_standings").upsert(rows, {
    onConflict: "season_id,stage,group_name,team_id",
  });
  if (error) throw new Error(`Error saving stage standings: ${error.message}`);
  console.log(`Saved ${rows.length} stage standings rows to Supabase`);
}

type MatchRow = Record<string, unknown>;

async function buildMatchKey(
  seasonId: string,
  jornada: number,
  localTeamId: string,
  awayTeamId: string,
) {
  return `${seasonId}|${jornada}|${localTeamId}|${awayTeamId}`;
}

async function getExistingMatches(
  supabase: SupabaseClient,
  seasonId: string,
  keys: string[],
) {
  if (keys.length === 0) return new Map<string, MatchRow>();

  const { data } = await supabase
    .from("matches")
    .select(
      "id, season_id, jornada, local_team_id, away_team_id, local_score, away_score, match_date, match_time, status, phase",
    )
    .eq("season_id", seasonId);

  const map = new Map<string, MatchRow>();
  for (const row of data ?? []) {
    const k = await buildMatchKey(
      row.season_id,
      row.jornada,
      row.local_team_id,
      row.away_team_id,
    );
    map.set(k, row);
  }
  return map;
}

export function mergeFields(
  existing: MatchRow | undefined,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  if (!existing) return incoming;

  const merged: Record<string, unknown> = { ...incoming };
  const preserved = ["local_score", "away_score", "match_date", "match_time"] as const;

  for (const field of preserved) {
    if (incoming[field] == null && existing[field] != null) {
      merged[field] = existing[field];
    }
  }

  return merged;
}

export async function saveMatchesToSupabase(
  matchdays: Matchday[],
  supabase: SupabaseClient,
  phase: string,
) {
  const { data: teams } = await supabase.from("teams").select("id, name");
  if (!teams) throw new Error("No teams found in DB");

  const teamMap = new Map(teams.map((t) => [t.name, t.id]));

  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!season) throw new Error("No active season found");

  const raw: Record<string, Record<string, unknown>> = {};
  const seen = new Set<string>();

  for (const md of matchdays) {
    for (const m of md.partidos) {
      const localId = teamMap.get(m.local);
      const awayId = teamMap.get(m.visitante);
      if (!localId || !awayId) {
        console.warn(`Skipping ${m.local} vs ${m.visitante} - team not found`);
        continue;
      }

      const key = `${m.local}-${m.visitante}-${md.jornada}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const mk = await buildMatchKey(season.id, md.jornada, localId, awayId);
      raw[mk] = {
        season_id: season.id,
        jornada: md.jornada,
        phase,
        local_team_id: localId,
        away_team_id: awayId,
        local_score: m.golesLocal ?? null,
        away_score: m.golesVisitante ?? null,
        match_date: m.fecha || md.fecha || null,
        match_time: m.hora || null,
        status: m.golesLocal != null ? "played" : "scheduled",
      };
    }
  }

  if (Object.keys(raw).length === 0) {
    console.log("No matches to save");
    return;
  }

  const existing = await getExistingMatches(
    supabase,
    season.id,
    Object.keys(raw),
  );
  const toUpsert = Object.entries(raw).map(([k, v]) =>
    mergeFields(existing.get(k), v),
  );

  const { error } = await supabase.from("matches").upsert(toUpsert, {
    onConflict: "season_id,jornada,local_team_id,away_team_id",
    ignoreDuplicates: false,
  });

  if (error) throw new Error(`Error saving matches: ${error.message}`);
  console.log(`Saved ${toUpsert.length} matches to Supabase`);
}

export async function saveResultsToSupabase(
  results: Matchday[],
  supabase: SupabaseClient,
) {
  await saveMatchesToSupabase(results, supabase, "regular");
}

export async function saveUpcomingToSupabase(
  upcoming: UpcomingMatch[],
  supabase: SupabaseClient,
) {
  const { data: teams } = await supabase.from("teams").select("id, name");
  if (!teams) throw new Error("No teams found in DB");

  const teamMap = new Map(teams.map((t) => [t.name, t.id]));

  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!season) throw new Error("No active season found");

  const raw: Record<string, Record<string, unknown>> = {};
  const seen = new Set<string>();

  for (const m of upcoming) {
    const localId = teamMap.get(m.local);
    const awayId = teamMap.get(m.visitante);
    if (!localId || !awayId) {
      console.warn(`Skipping ${m.local} vs ${m.visitante} - team not found`);
      continue;
    }

    const key = `${m.local}-${m.visitante}-${m.jornada}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const mk = await buildMatchKey(season.id, m.jornada, localId, awayId);
    raw[mk] = {
      season_id: season.id,
      jornada: m.jornada,
      phase: "regular",
      local_team_id: localId,
      away_team_id: awayId,
      match_date: m.fecha || null,
      match_time: m.hora || null,
      status: "scheduled",
    };
  }

  if (Object.keys(raw).length === 0) {
    console.log("No upcoming matches to save");
    return;
  }

  const existing = await getExistingMatches(
    supabase,
    season.id,
    Object.keys(raw),
  );
  const toUpsert = Object.entries(raw).map(([k, v]) =>
    mergeFields(existing.get(k), v),
  );

  const { error } = await supabase.from("matches").upsert(toUpsert, {
    onConflict: "season_id,jornada,local_team_id,away_team_id",
    ignoreDuplicates: false,
  });

  if (error) throw new Error(`Error saving upcoming: ${error.message}`);
  console.log(`Saved ${toUpsert.length} upcoming matches to Supabase`);
}

export type CuadrangularFixture = UpcomingMatch & {
  group_name: "A" | "B"
  golesLocal?: number
  golesVisitante?: number
  matchStatus?: string
}

export function getCuadrangularMatchStatus(
  fixture: Pick<CuadrangularFixture, "golesLocal" | "golesVisitante" | "matchStatus">,
): "scheduled" | "live" | "played" {
  const sourceStatus = fixture.matchStatus?.toLowerCase() ?? ""
  if (sourceStatus.includes("vivo") || sourceStatus.includes("live")) return "live"
  if (sourceStatus.includes("final") || sourceStatus.includes("termin")) return "played"
  if (fixture.golesLocal != null && fixture.golesVisitante != null) return "played"
  return "scheduled"
}

export async function saveCuadrangularFixturesToSupabase(
  fixtures: CuadrangularFixture[],
  supabase: SupabaseClient,
) {
  const { data: teams } = await supabase.from("teams").select("id, name");
  if (!teams) throw new Error("No teams found in DB");
  const teamMap = new Map(teams.map((t) => [t.name, t.id]));
  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .single();
  if (!season) throw new Error("No active season found");

  const raw: Record<string, Record<string, unknown>> = {};
  const seen = new Set<string>();
  const groups: Record<string, "A" | "B"> = {
    "Atl. Nacional": "A",
    "Inter de Bogotá": "A",
    "Inter Palmira": "A",
    Millonarios: "A",
    Cali: "B",
    América: "B",
    "Santa Fe": "B",
    Orsomarso: "B",
  };
  for (const m of fixtures) {
    if (groups[m.local] !== m.group_name || groups[m.visitante] !== m.group_name) {
      console.warn(`Skipping ${m.local} vs ${m.visitante} - cruza grupos o no pertenece al cuadrangular`);
      continue;
    }
    const localId = teamMap.get(m.local);
    const awayId = teamMap.get(m.visitante);
    if (!localId || !awayId) {
      console.warn(`Skipping ${m.local} vs ${m.visitante} - team not found`);
      continue;
    }
    const key = `${m.local}-${m.visitante}-${m.jornada}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const mk = await buildMatchKey(season.id, m.jornada, localId, awayId);
    const status = getCuadrangularMatchStatus(m)
    raw[mk] = {
      season_id: season.id,
      jornada: m.jornada,
      phase: "cuadrangular",
      group_name: m.group_name,
      local_team_id: localId,
      away_team_id: awayId,
      match_date: m.fecha || null,
      match_time: m.hora || null,
      status,
      local_score: m.golesLocal ?? null,
      away_score: m.golesVisitante ?? null,
    };
  }
  if (Object.keys(raw).length === 0) {
    console.log("No cuadrangular fixtures to save");
    return;
  }
  const existing = await getExistingMatches(supabase, season.id, Object.keys(raw));
  const toUpsert = Object.entries(raw).map(([k, v]) => mergeFields(existing.get(k), v));
  const { error } = await supabase.from("matches").upsert(toUpsert, {
    onConflict: "season_id,jornada,local_team_id,away_team_id",
    ignoreDuplicates: false,
  });
  if (error) throw new Error(`Error saving cuadrangular fixtures: ${error.message}`);
  console.log(`Saved ${toUpsert.length} cuadrangular fixtures to Supabase`);
}
