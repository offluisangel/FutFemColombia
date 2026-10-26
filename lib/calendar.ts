import { createClient } from "@/lib/supabase/server";

export const CALENDAR_TIME_ZONE = "America/Bogota";
export const CALENDAR_CACHE_CONTROL = "public, max-age=300, s-maxage=300";

export type CalendarMatch = {
  id: string;
  seasonId: string;
  seasonName?: string | null;
  jornada: number | null;
  phase: string | null;
  localTeamId: string;
  awayTeamId: string;
  localTeamName: string;
  awayTeamName: string;
  localScore: number | null;
  awayScore: number | null;
  matchDate: string | null;
  matchTime: string | null;
  status: string;
  createdAt?: string | null;
};

const MATCH_FIELDS =
  "id, season_id, jornada, phase, local_team_id, away_team_id, local_score, away_score, match_date, match_time, status, created_at";

function escapeText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll(/\r?\n/g, "\\n");
}

function foldLine(line: string): string[] {
  const bytes = new TextEncoder().encode(line);
  const lines: string[] = [];
  let start = 0;
  while (start < bytes.length) {
    let end = Math.min(start + (start === 0 ? 75 : 74), bytes.length);
    while (end > start && (bytes[end] & 0xc0) === 0x80) end--;
    const value = new TextDecoder().decode(bytes.slice(start, end));
    lines.push(lines.length === 0 ? value : ` ${value}`);
    start = end;
  }
  return lines;
}

function nextDate(date: string): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10).replaceAll("-", "");
}

function formatUtc(value: Date): string {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function formatLocalDate(date: string): string {
  return date.replaceAll("-", "");
}

function formatLocalDateTime(date: string, time: string): string {
  const normalized = time.length === 5 ? `${time}:00` : time;
  return `${formatLocalDate(date)}T${normalized.replaceAll(":", "")}`;
}

function statusFor(match: CalendarMatch): "CONFIRMED" | "TENTATIVE" | "CANCELLED" {
  if (["cancelled", "canceled"].includes(match.status.toLowerCase())) return "CANCELLED";
  if (["played", "completed", "final"].includes(match.status.toLowerCase())) return "CONFIRMED";
  return "TENTATIVE";
}

function summaryFor(match: CalendarMatch): string {
  const teams = `${match.localTeamName} vs ${match.awayTeamName}`;
  if (match.localScore !== null && match.awayScore !== null) {
    return `${match.localTeamName} ${match.localScore}–${match.awayScore} ${match.awayTeamName}`;
  }
  return teams;
}

export function serializeCalendar(matches: CalendarMatch[], now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FutFemColombia//Match Calendar//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:FutFemColombia",
    "X-WR-CALDESC:Partidos de la Liga Femenina de Colombia",
    `X-WR-TIMEZONE:${CALENDAR_TIME_ZONE}`,
  ];

  for (const match of matches) {
    if (!match.matchDate) continue;
    const status = statusFor(match);
    const summary = summaryFor(match);
    const description = [
      match.jornada ? `Jornada ${match.jornada}` : null,
      match.phase ? `Fase: ${match.phase}` : null,
      match.matchTime ? null : "Hora por confirmar",
    ].filter(Boolean).join(" · ");
    const lastModified = match.createdAt ? new Date(match.createdAt) : now;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeText(match.id)}@futfemcolombia.site`,
      `DTSTAMP:${formatUtc(now)}`,
      `LAST-MODIFIED:${formatUtc(lastModified)}`,
      `SEQUENCE:${status === "CANCELLED" ? 1 : match.localScore !== null && match.awayScore !== null ? 1 : 0}`,
      match.matchTime
        ? `DTSTART;TZID=${CALENDAR_TIME_ZONE}:${formatLocalDateTime(match.matchDate, match.matchTime)}`
        : `DTSTART;VALUE=DATE:${formatLocalDate(match.matchDate)}`,
      match.matchTime
        ? `DTEND;TZID=${CALENDAR_TIME_ZONE}:${formatLocalDateTime(match.matchDate, match.matchTime)}`
        : `DTEND;VALUE=DATE:${nextDate(match.matchDate)}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${escapeText(description)}`,
      `STATUS:${status}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.flatMap(foldLine).join("\r\n")}\r\n`;
}

type MatchRow = Record<string, unknown>;
type TeamRow = { id: string; name: string; slug?: string };

function normalizeMatch(row: MatchRow, teams: Map<string, TeamRow>, seasonName?: string | null): CalendarMatch {
  const local = teams.get(String(row.local_team_id));
  const away = teams.get(String(row.away_team_id));
  return {
    id: String(row.id),
    seasonId: String(row.season_id),
    seasonName,
    jornada: typeof row.jornada === "number" ? row.jornada : null,
    phase: typeof row.phase === "string" ? row.phase : null,
    localTeamId: String(row.local_team_id),
    awayTeamId: String(row.away_team_id),
    localTeamName: local?.name ?? "Equipo local",
    awayTeamName: away?.name ?? "Equipo visitante",
    localScore: typeof row.local_score === "number" ? row.local_score : null,
    awayScore: typeof row.away_score === "number" ? row.away_score : null,
    matchDate: typeof row.match_date === "string" ? row.match_date : null,
    matchTime: typeof row.match_time === "string" ? row.match_time : null,
    status: typeof row.status === "string" ? row.status : "scheduled",
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
  };
}

async function teamMap(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{ map: Map<string, TeamRow>; error?: boolean }> {
  const { data, error } = await supabase.from("teams").select("id, name, slug");
  return {
    map: new Map(((data ?? []) as TeamRow[]).map((team) => [team.id, team])),
    error: Boolean(error),
  };
}

export async function getActiveSeasonMatches(teamSlug?: string): Promise<{ matches: CalendarMatch[]; error?: string; teamFound?: boolean }> {
  const supabase = await createClient();
  const { data: season, error: seasonError } = await supabase
    .from("seasons").select("id, name").eq("is_active", true).maybeSingle();
  if (seasonError) return { matches: [], error: "No se pudo consultar la temporada activa." };
  if (!season) return { matches: [] };

  let teamId: string | undefined;
  if (teamSlug) {
    const { data: team, error } = await supabase.from("teams").select("id").eq("slug", teamSlug).maybeSingle();
    if (error) return { matches: [], error: "No se pudo consultar el equipo." };
    if (!team) return { matches: [], teamFound: false };
    teamId = team.id;
  }

  let query = supabase.from("matches").select(MATCH_FIELDS).eq("season_id", season.id).order("match_date", { ascending: true });
  if (teamId) query = query.or(`local_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
  const { data, error } = await query;
  if (error) return { matches: [], error: "No se pudieron consultar los partidos." };
  const teams = await teamMap(supabase);
  if (teams.error) return { matches: [], error: "No se pudieron consultar los equipos." };
  return { matches: ((data ?? []) as MatchRow[]).map((row) => normalizeMatch(row, teams.map, season.name)) };
}
