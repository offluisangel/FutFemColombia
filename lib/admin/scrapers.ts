import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchScorers, type Scorer } from "@/lib/dimayor-ajax";
import {
  fetchStandings,
  fetchStageStandings,
  fetchAllMatchdays,
  fetchCuadrangularMatchdays,
  fetchUpcomingWeeks,
  type Standing,
  type StageStandings,
  type Matchday,
  type UpcomingMatch,
} from "@/lib/winsports-api";
import {
  scrapeStandingsHTML,
  scrapeStageStandingsHTML,
  scrapeResultsHTML,
  scrapeUpcomingHTML,
  scrapeAllMatchdaysHTML,
  scrapeCuadrangularMatchesHTML,
} from "@/lib/winsports-html";
import {
  fetchCuadrangularGroupMap,
  inferCuadrangularGroup,
  type CuadrangularGroupMap,
} from "@/lib/cuadrangular-groups";
import {
  saveMatchesToSupabase,
  saveResultsToSupabase,
  saveStandingsToSupabase,
  saveStageStandingsToSupabase,
  saveCuadrangularFixturesToSupabase,
  saveUpcomingToSupabase,
  saveScorersToSupabase,
  getCuadrangularMatchStatus,
  type CuadrangularFixture,
} from "@/lib/save-to-supabase";

export type ScraperId = "standings" | "matches" | "results" | "upcoming" | "scorers"
  | "standings-html" | "results-html" | "upcoming-html" | "matches-html"
  | "stage-standings" | "stage-standings-html" | "cuadrangular-matches" | "cuadrangular-matches-html";

export const BASE_SCRAPERS: ScraperId[] = ["standings", "matches", "results", "upcoming", "scorers", "stage-standings", "cuadrangular-matches"];

type JsonRecord = Record<string, unknown>;

type DiffItem = {
  type: "create" | "update" | "unchanged" | "skip";
  entity: string;
  label: string;
  key?: string;
  before?: JsonRecord | null;
  after?: JsonRecord | null;
  changes?: Record<string, { before: unknown; after: unknown }>;
  reason?: string;
  notes?: string[];
};

export const SCRAPER_CONFIGS: Record<
  ScraperId,
  { label: string; sourceUrl: string }
> = {
  standings: {
    label: "Tabla de posiciones (API)",
    sourceUrl:
      "https://www.winsports.co/futbol-colombiano/liga-femenina/posiciones",
  },
  matches: {
    label: "Calendario completo (API)",
    sourceUrl:
      "https://www.winsports.co/futbol-colombiano/liga-femenina/partidos",
  },
  results: {
    label: "Resultados (API)",
    sourceUrl:
      "https://www.winsports.co/futbol-colombiano/liga-femenina/resultados",
  },
  upcoming: {
    label: "Próximos partidos (API)",
    sourceUrl:
      "https://www.winsports.co/futbol-colombiano/liga-femenina/partidos",
  },
  scorers: {
    label: "Goleadoras (Dimayor)",
    sourceUrl: "https://dimayor.com.co/",
  },
  "standings-html": {
    label: "Tabla de posiciones (HTML)",
    sourceUrl: "https://www.winsports.co/futbol-colombiano/liga-femenina/posiciones",
  },
  "results-html": {
    label: "Resultados (HTML)",
    sourceUrl: "https://www.winsports.co/futbol-colombiano/liga-femenina/resultados",
  },
  "upcoming-html": {
    label: "Próximos partidos (HTML)",
    sourceUrl: "https://www.winsports.co/futbol-colombiano/liga-femenina/partidos",
  },
  "matches-html": {
    label: "Calendario completo (HTML)",
    sourceUrl: "https://www.winsports.co/futbol-colombiano/liga-femenina/partidos",
  },
  "stage-standings": {
    label: "Cuadrangulares — Posiciones (API)",
    sourceUrl: "https://www.winsports.co/api/standings?stageId=84n6bl7fg3hut5al91qnc9ams",
  },
  "stage-standings-html": {
    label: "Cuadrangulares — Posiciones (HTML)",
    sourceUrl: "https://www.winsports.co/futbol-colombiano/liga-femenina/posiciones",
  },
  "cuadrangular-matches": {
    label: "Cuadrangulares — Fixtures (API)",
    sourceUrl: "https://www.winsports.co/api/matches/competition?stageId=84n6bl7fg3hut5al91qnc9ams",
  },
  "cuadrangular-matches-html": {
    label: "Cuadrangulares — Fixtures (HTML)",
    sourceUrl: "https://www.winsports.co/futbol-colombiano/liga-femenina/partidos",
  },
};

export function isScraperId(value: string): value is ScraperId {
  const valid: ScraperId[] = [
    "standings", "matches", "results", "upcoming", "scorers",
    "standings-html", "matches-html", "results-html", "upcoming-html",
    "stage-standings", "stage-standings-html", "cuadrangular-matches", "cuadrangular-matches-html",
  ];
  return (valid as string[]).includes(value);
}

function htmlVariant(scraper: ScraperId): ScraperId | null {
  const htmlId = `${scraper}-html` as ScraperId;
  return isScraperId(htmlId) ? htmlId : null;
}

type MatchLike = { fecha?: string; hora?: string };

function flattenMatches(data: unknown): MatchLike[] {
  if (!Array.isArray(data)) return [];
  const rows = data as Array<Record<string, unknown>>;
  if (rows.length === 0) return [];
  if (Array.isArray(rows[0]?.partidos)) {
    return (rows as unknown as Matchday[]).flatMap((m) => m.partidos ?? []);
  }
  return rows as MatchLike[];
}

function isHtmlDataUsable(scraper: ScraperId, data: unknown): boolean {
  if (!data) return false;
  if (Array.isArray(data) && data.length === 0) return false;
  if (scraper === "standings" || scraper === "scorers" || scraper === "stage-standings") return true;
  if (scraper === "stage-standings-html") {
    const d = data as StageStandings;
    return Boolean(d && typeof d === "object" && "A" in d && "B" in d && (d as StageStandings).A.length === 4 && (d as StageStandings).B.length === 4);
  }
  if (scraper === "cuadrangular-matches" || scraper === "cuadrangular-matches-html") {
    const arr = Array.isArray(data) ? data as Array<Record<string, unknown>> : [];
    // puede venir como Matchday[] (API) o CuadrangularFixture[] (HTML)
    const matches = (arr[0] as Record<string, unknown>)?.["partidos"] ? flattenMatches(data) : (arr as MatchLike[]);
    if (matches.length === 0) return false;
    return matches.every((m) => Boolean(m.fecha && m.hora));
  }
  const matches = flattenMatches(data);
  if (matches.length === 0) return false;
  return matches.every((m) => Boolean(m.fecha && m.hora));
}

export async function scrapeWithFallback(
  scraper: ScraperId,
): Promise<{ data: unknown; source: "html" | "api"; warnings?: string[] }> {
  const htmlId = htmlVariant(scraper);
  let htmlData: unknown = null;

  if (htmlId) {
    try {
      htmlData = await scrapeRaw(htmlId);
    } catch {
      htmlData = null;
    }
  }

  if (htmlData && isHtmlDataUsable(scraper, htmlData)) {
    return { data: htmlData, source: "html" };
  }

  const data = await scrapeRaw(scraper);

  if (Array.isArray(data) && data.length > 0) {
    return {
      data,
      source: "api",
      warnings: htmlData
        ? ["HTML de Win Sports llegó sin fecha/hora (degradado); se usó la API."]
        : undefined,
    };
  }

  if (htmlData) {
    return {
      data: htmlData,
      source: "html",
      warnings: [
        "La API no devolvió datos; se usó el HTML aunque venga degradado.",
      ],
    };
  }

  return { data, source: "api" };
}

export async function scrapeRaw(scraper: ScraperId) {
  if (scraper === "standings") return fetchStandings();
  if (scraper === "matches") return fetchAllMatchdays();
  if (scraper === "results") return fetchAllMatchdays();
  if (scraper === "upcoming") return fetchUpcomingWeeks();
  if (scraper === "scorers") return fetchScorers();
  if (scraper === "stage-standings") return fetchStageStandings();
  if (scraper === "cuadrangular-matches") return fetchCuadrangularMatchdays();
  if (scraper === "standings-html") return scrapeStandingsHTML();
  if (scraper === "results-html") return scrapeResultsHTML();
  if (scraper === "upcoming-html") return scrapeUpcomingHTML();
  if (scraper === "matches-html") return scrapeAllMatchdaysHTML();
  if (scraper === "stage-standings-html") return scrapeStageStandingsHTML();
  if (scraper === "cuadrangular-matches-html")
    return scrapeCuadrangularMatchesHTML(await fetchCuadrangularGroupMap());
  return fetchUpcomingWeeks();
}

export async function applyScraperData(
  scraper: ScraperId,
  rawData: unknown,
  supabase: SupabaseClient,
) {
  if (scraper === "standings" || scraper === "standings-html") {
    await saveStandingsToSupabase(
      rawData as Standing[],
      supabase,
    );
    return;
  }

  if (scraper === "stage-standings" || scraper === "stage-standings-html") {
    await saveStageStandingsToSupabase(
      rawData as StageStandings,
      supabase,
    );
    return;
  }

  if (scraper === "cuadrangular-matches" || scraper === "cuadrangular-matches-html") {
    let asFixture: CuadrangularFixture[];
    if (Array.isArray(rawData) && rawData.length > 0 && "partidos" in (rawData[0] as Record<string, unknown>)) {
      const groups = await fetchCuadrangularGroupMap();
      asFixture = [];
      for (const md of rawData as Matchday[]) {
        for (const p of md.partidos) {
          const group = inferCuadrangularGroup(groups, p.local, p.visitante);
          if (!group) {
            console.warn(`Cuadrangular: partido sin grupo clasificable (${p.local} vs ${p.visitante}); se omite`);
            continue;
          }
          asFixture.push({
            local: p.local,
            visitante: p.visitante,
            fecha: (p.fecha as string) ?? "",
            hora: p.hora,
            jornada: md.jornada,
            group_name: group,
            golesLocal: p.golesLocal,
            golesVisitante: p.golesVisitante,
            matchStatus: p.matchStatus,
          });
        }
      }
    } else {
      asFixture = rawData as CuadrangularFixture[];
    }
    await saveCuadrangularFixturesToSupabase(asFixture, supabase);
    return;
  }

  if (scraper === "matches" || scraper === "matches-html") {
    await saveMatchesToSupabase(
      rawData as Matchday[],
      supabase,
      "regular",
    );
    return;
  }

  if (scraper === "results" || scraper === "results-html") {
    await saveResultsToSupabase(
      rawData as Matchday[],
      supabase,
    );
    return;
  }

  if (scraper === "scorers") {
    await saveScorersToSupabase(rawData as Scorer[], supabase);
    return;
  }

  await saveUpcomingToSupabase(
    rawData as UpcomingMatch[],
    supabase,
  );
}

function diffFields(before: JsonRecord | null | undefined, after: JsonRecord) {
  const changes: Record<string, { before: unknown; after: unknown }> = {};

  if (!before) return changes;

  for (const [key, value] of Object.entries(after)) {
    if (["id", "season_id", "team_id"].includes(key)) continue;
    if (before[key] !== value) {
      changes[key] = { before: before[key] ?? null, after: value ?? null };
    }
  }

  return changes;
}

function summarize(diff: DiffItem[], fetched: number, warnings: string[]) {
  return {
    fetched,
    creates: diff.filter((item) => item.type === "create").length,
    updates: diff.filter((item) => item.type === "update").length,
    unchanged: diff.filter((item) => item.type === "unchanged").length,
    skipped: diff.filter((item) => item.type === "skip").length,
    warnings: warnings.length,
    errors: 0,
  };
}

async function buildStandingsPreview(
  rawData: Standing[],
  supabase: SupabaseClient,
) {
  const warnings: string[] = [];
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, full_name, slug, city, shield_url");
  const { data: standings } = await supabase.from("standings").select("*");

  const teamsByName = new Map((teams ?? []).map((team) => [team.name, team]));
  const standingsByTeam = new Map(
    (standings ?? []).map((row) => [row.team_id, row as JsonRecord]),
  );

  const normalized = rawData.map((row) => {
    const team = teamsByName.get(row.name);
    return {
      team_id: team?.id ?? null,
      team_name: row.name,
      pos: row.pos,
      pts: row.pts,
      pj: row.pj,
      pg: row.pg,
      pe: row.pe,
      pp: row.pp,
      gf: row.gf,
      gc: row.gc,
      dif: row.dif,
    };
  });

  const diff: DiffItem[] = normalized.map((row) => {
    const existing = row.team_id ? standingsByTeam.get(row.team_id) : null;
    const after = {
      team_id: row.team_id,
      pos: row.pos,
      pts: row.pts,
      pj: row.pj,
      pg: row.pg,
      pe: row.pe,
      pp: row.pp,
      gf: row.gf,
      gc: row.gc,
      dif: row.dif,
    };

    if (!row.team_id) {
      warnings.push(
        `Equipo no encontrado en DB: ${row.team_name}. Se creará si se aplica el scraper.`,
      );
      return {
        type: "create",
        entity: "standing",
        label: row.team_name,
        after,
        notes: [
          "El equipo no existe todavía; la función de guardado actual lo crea vía upsert.",
        ],
      };
    }

    if (!existing) {
      return {
        type: "create",
        entity: "standing",
        label: row.team_name,
        after,
      };
    }

    const changes = diffFields(existing, after);
    return {
      type: Object.keys(changes).length > 0 ? "update" : "unchanged",
      entity: "standing",
      label: row.team_name,
      key: row.team_id,
      before: existing,
      after,
      changes,
    };
  });

  return {
    normalized,
    diff,
    warnings,
    summary: summarize(diff, rawData.length, warnings),
  };
}

async function buildStageStandingsPreview(
  rawData: StageStandings,
  supabase: SupabaseClient,
) {
  const warnings: string[] = [];
  const season = await getActiveSeason(supabase);
  if (!season) return { normalized: [], diff: [], warnings: ["No hay temporada activa."], summary: summarize([], 0, ["No hay temporada activa."]) };
  const { data: teams } = await supabase.from("teams").select("id, name");
  const teamMap = new Map((teams ?? []).map((t) => [t.name, t.id]));
  const { data: existingRows } = await supabase.from("stage_standings").select("*").eq("season_id", season.id).eq("stage", "cuadrangular");
  const existingMap = new Map((existingRows ?? []).map((r) => [`${r.group_name}|${r.team_id}`, r as JsonRecord]));
  const normalized: JsonRecord[] = [];
  const diff: DiffItem[] = [];
  for (const group of ["A", "B"] as const) {
    for (const row of rawData[group] ?? []) {
      const teamId = teamMap.get(row.name);
      const label = `Grupo ${group} · ${row.name} (#${row.pos})`;
      if (!teamId) {
        warnings.push(`Equipo no encontrado para ${label}`);
        normalized.push({ label, skipped: true, reason: "Equipo no encontrado" });
        diff.push({ type: "skip", entity: "stage_standing", label, reason: "Equipo no encontrado" });
        continue;
      }
      const after = { season_id: season.id, stage: "cuadrangular", group_name: group, team_id: teamId, pos: row.pos, pts: row.pts, pj: row.pj, pg: row.pg, pe: row.pe, pp: row.pp, gf: row.gf, gc: row.gc, dif: row.dif };
      normalized.push({ ...after, label });
      const key = `${group}|${teamId}`;
      const before = existingMap.get(key);
      if (!before) diff.push({ type: "create", entity: "stage_standing", label, after });
      else {
        const changes = diffFields(before, after);
        diff.push({ type: Object.keys(changes).length ? "update" : "unchanged", entity: "stage_standing", label, key: String((before as Record<string, unknown>).id ?? key), before, after, changes });
      }
    }
  }
  return { normalized, diff, warnings, summary: summarize(diff, 8, warnings) };
}

async function normalizeCuadrangular(
  rawData: unknown,
  supabase: SupabaseClient,
) {
  const warnings: string[] = [];
  const season = await getActiveSeason(supabase);
  if (!season) return { normalized: [], warnings: ["No hay temporada activa."], season: null };
  const { data: teams } = await supabase.from("teams").select("id, name");
  const teamMap = new Map((teams ?? []).map((t) => [t.name, t.id]));
  const normalized: JsonRecord[] = [];
  const seen = new Set<string>();
  let list: Array<{ jornada: number; fecha?: string; hora?: string; local: string; visitante: string; group_name?: string; golesLocal?: number; golesVisitante?: number; matchStatus?: string }> = [];
  if (Array.isArray(rawData) && rawData.length > 0 && typeof rawData[0] === "object" && "partidos" in (rawData[0] as Record<string, unknown>)) {
    const mdays = rawData as Matchday[];
    let groups: CuadrangularGroupMap = {};
    try {
      groups = await fetchCuadrangularGroupMap();
    } catch (error) {
      warnings.push(`Standings de cuadrangular no disponibles: ${error instanceof Error ? error.message : String(error)}`);
    }
    for (const md of mdays) {
      for (const p of md.partidos) {
        const group = inferCuadrangularGroup(groups, p.local, p.visitante);
        if (!group) {
          warnings.push(`Partido sin grupo clasificable: ${p.local} vs ${p.visitante}`);
          continue;
        }
        list.push({ jornada: md.jornada, fecha: (p.fecha as string) ?? md.fecha, hora: p.hora, local: p.local, visitante: p.visitante, group_name: group, golesLocal: p.golesLocal, golesVisitante: p.golesVisitante, matchStatus: p.matchStatus });
      }
    }
  } else {
    list = (rawData as CuadrangularFixture[]).map((r) => ({ jornada: r.jornada, fecha: r.fecha, hora: r.hora, local: r.local, visitante: r.visitante, group_name: r.group_name, golesLocal: r.golesLocal, golesVisitante: r.golesVisitante, matchStatus: r.matchStatus }));
  }
  for (const m of list) {
    const localId = teamMap.get(m.local);
    const awayId = teamMap.get(m.visitante);
    const label = `${m.local} vs ${m.visitante} · J${m.jornada} · Grupo ${m.group_name}`;
    if (!localId || !awayId) {
      warnings.push(`Equipo no encontrado para ${label}`);
      normalized.push({ label, skipped: true, reason: "Equipo no encontrado" });
      continue;
    }
    const dedupe = `${m.jornada}|${localId}|${awayId}`;
    if (seen.has(dedupe)) { warnings.push(`Duplicado ${label}`); continue; }
    seen.add(dedupe);
    const fixture = { ...m, group_name: (m.group_name ?? "A") as "A" | "B" };
    normalized.push({ season_id: season.id, jornada: m.jornada, phase: "cuadrangular", group_name: m.group_name, local_team_id: localId, away_team_id: awayId, local_score: m.golesLocal ?? null, away_score: m.golesVisitante ?? null, match_date: m.fecha || null, match_time: m.hora || null, status: getCuadrangularMatchStatus(fixture), label });
  }
  return { normalized, warnings, season };
}

async function getActiveSeason(supabase: SupabaseClient) {
  const { data: season } = await supabase
    .from("seasons")
    .select("id, name")
    .eq("is_active", true)
    .maybeSingle();

  return season;
}

function buildMatchKey(row: JsonRecord) {
  return `${row.season_id}|${row.jornada}|${row.local_team_id}|${row.away_team_id}`;
}

function mergeLikeCurrentSave(
  existing: JsonRecord | undefined,
  incoming: JsonRecord,
) {
  if (!existing) return { merged: incoming, notes: [] as string[] };

  const merged = { ...incoming };
  const notes: string[] = [];
  for (const field of ["local_score", "away_score"]) {
    if (incoming[field] == null && existing[field] != null) {
      merged[field] = existing[field];
      notes.push(
        `Se conserva ${field} existente (${existing[field]}), el scraper no trajo dato.`,
      );
    }
  }

  return { merged, notes };
}

async function normalizeMatchdays(
  rawData: Matchday[],
  supabase: SupabaseClient,
  statusFromScore: boolean,
) {
  const warnings: string[] = [];
  const { data: teams } = await supabase.from("teams").select("id, name");
  const season = await getActiveSeason(supabase);

  if (!season) {
    return {
      normalized: [],
      warnings: ["No hay temporada activa. No se pueden aplicar partidos."],
      season: null,
    };
  }

  const teamMap = new Map((teams ?? []).map((team) => [team.name, team.id]));
  const normalized: JsonRecord[] = [];
  const seen = new Set<string>();

  for (const matchday of rawData) {
    for (const match of matchday.partidos) {
      const localId = teamMap.get(match.local);
      const awayId = teamMap.get(match.visitante);
      const label = `${match.local} vs ${match.visitante} · J${matchday.jornada}`;

      if (!localId || !awayId) {
        warnings.push(`Equipo no encontrado para ${label}`);
        normalized.push({
          label,
          skipped: true,
          reason: "Equipo no encontrado",
        });
        continue;
      }

      const dedupeKey = `${matchday.jornada}|${localId}|${awayId}`;
      if (seen.has(dedupeKey)) {
        warnings.push(`Partido duplicado omitido: ${label}`);
        continue;
      }
      seen.add(dedupeKey);

      const hasScore = "golesLocal" in match && match.golesLocal != null;
      normalized.push({
        season_id: season.id,
        jornada: matchday.jornada,
        phase: "regular",
        local_team_id: localId,
        away_team_id: awayId,
        local_team_name: match.local,
        away_team_name: match.visitante,
        local_score: hasScore ? match.golesLocal : null,
        away_score: hasScore ? match.golesVisitante : null,
        match_date:
          ("fecha" in match ? match.fecha : "") || matchday.fecha || null,
        match_time: match.hora || null,
        status: statusFromScore && hasScore ? "played" : "scheduled",
        label,
      });
    }
  }

  return { normalized, warnings, season };
}

async function normalizeUpcoming(
  rawData: UpcomingMatch[],
  supabase: SupabaseClient,
) {
  const warnings: string[] = [];
  const { data: teams } = await supabase.from("teams").select("id, name");
  const season = await getActiveSeason(supabase);

  if (!season) {
    return {
      normalized: [],
      warnings: [
        "No hay temporada activa. No se pueden aplicar próximos partidos.",
      ],
      season: null,
    };
  }

  const teamMap = new Map((teams ?? []).map((team) => [team.name, team.id]));
  const normalized: JsonRecord[] = [];
  const seen = new Set<string>();

  for (const match of rawData) {
    const localId = teamMap.get(match.local);
    const awayId = teamMap.get(match.visitante);
    const label = `${match.local} vs ${match.visitante} · J${match.jornada}`;

    if (!localId || !awayId) {
      warnings.push(`Equipo no encontrado para ${label}`);
      normalized.push({ label, skipped: true, reason: "Equipo no encontrado" });
      continue;
    }

    const dedupeKey = `${match.jornada}|${localId}|${awayId}`;
    if (seen.has(dedupeKey)) {
      warnings.push(`Partido duplicado omitido: ${label}`);
      continue;
    }
    seen.add(dedupeKey);

    normalized.push({
      season_id: season.id,
      jornada: match.jornada,
      phase: "regular",
      local_team_id: localId,
      away_team_id: awayId,
      local_team_name: match.local,
      away_team_name: match.visitante,
      match_date: match.fecha || null,
      match_time: match.hora || null,
      status: "scheduled",
      label,
    });
  }

  return { normalized, warnings, season };
}

async function buildMatchesPreview(
  normalized: JsonRecord[],
  warnings: string[],
  supabase: SupabaseClient,
) {
  const validRows = normalized.filter((row) => !row.skipped);
  const seasonId = validRows[0]?.season_id as string | undefined;
  const { data: existingRows } = seasonId
    ? await supabase.from("matches").select("*").eq("season_id", seasonId)
    : { data: [] };

  const existingMap = new Map(
    (existingRows ?? []).map((row) => [buildMatchKey(row), row as JsonRecord]),
  );

  const diff: DiffItem[] = normalized.map((row) => {
    if (row.skipped) {
      return {
        type: "skip",
        entity: "match",
        label: String(row.label ?? "Partido omitido"),
        reason: String(row.reason ?? "No se puede aplicar"),
      };
    }

    const existing = existingMap.get(buildMatchKey(row));
    const { label, local_team_name, away_team_name, ...incoming } = row;
    const { merged, notes } = mergeLikeCurrentSave(existing, incoming);

    if (!existing) {
      return {
        type: "create",
        entity: "match",
        label: String(label),
        after: merged,
        notes,
      };
    }

    const changes = diffFields(existing, merged);
    return {
      type: Object.keys(changes).length > 0 ? "update" : "unchanged",
      entity: "match",
      label: String(label),
      key: String(existing.id),
      before: existing,
      after: merged,
      changes,
      notes,
    };
  });

  return { diff, summary: summarize(diff, validRows.length, warnings) };
}

async function buildScorersPreview(rawData: Scorer[], supabase: SupabaseClient) {
  const { data: existingRows } = await supabase.from("scorers").select("*");
  const existing = new Map((existingRows ?? []).map((row) => [row.player_id, row as JsonRecord]));
  const normalized = rawData.map((scorer) => ({
    ...scorer,
    team_id: null,
    photo_url: scorer.photo_uuid ? `https://dimayor.com.co/wp-json/dimayor/v1/image/${scorer.photo_uuid}` : null,
  }));
  const warnings: string[] = [];
  const diff: DiffItem[] = normalized.map((row) => {
    const before = existing.get(row.player_id);
    const after = { ...row };
    if (!before) return { type: "create", entity: "scorer", label: row.name, after };
    const changes = diffFields(before, after);
    return {
      type: Object.keys(changes).length ? "update" : "unchanged",
      entity: "scorer",
      label: row.name,
      key: String(row.player_id),
      before,
      after,
      changes,
    };
  });
  return { normalized, diff, warnings, summary: summarize(diff, normalized.length, warnings) };
}

export async function buildScraperPreview(
  scraper: ScraperId,
  rawData: unknown,
  supabase: SupabaseClient,
) {
  const isHTML = scraper.endsWith("-html");
  const baseScraper = scraper.replace("-html", "") as ScraperId;

  if (baseScraper === "scorers") {
    return buildScorersPreview(rawData as Scorer[], supabase);
  }

  if (baseScraper === "standings") {
    return buildStandingsPreview(
      rawData as Standing[],
      supabase,
    );
  }

  if (baseScraper === "stage-standings") {
    return buildStageStandingsPreview(rawData as StageStandings, supabase);
  }

  if (baseScraper === "cuadrangular-matches") {
    const { normalized, warnings } = await normalizeCuadrangular(rawData, supabase);
    const { diff, summary } = await buildMatchesPreview(normalized, warnings, supabase);
    return { normalized, diff, warnings, summary };
  }

  if (baseScraper === "upcoming") {
    const { normalized, warnings } = await normalizeUpcoming(
      rawData as UpcomingMatch[],
      supabase,
    );
    const { diff, summary } = await buildMatchesPreview(
      normalized,
      warnings,
      supabase,
    );
    return { normalized, diff, warnings, summary };
  }

  const statusFromScore = baseScraper === "results" || scraper === "results-html";
  const normalizedResult = await normalizeMatchdays(
    rawData as Matchday[],
    supabase,
    statusFromScore,
  );
  const { diff, summary } = await buildMatchesPreview(
    normalizedResult.normalized,
    normalizedResult.warnings,
    supabase,
  );
  return {
    normalized: normalizedResult.normalized,
    diff,
    warnings: normalizedResult.warnings,
    summary,
  };
}
