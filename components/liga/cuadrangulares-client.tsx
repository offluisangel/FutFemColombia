"use client";

import { useState } from "react";
import { SiteHeader, type TeamInfo } from "@/components/liga/site-header";
import { TeamShield } from "@/components/liga/team-shield";
import {
  Trophy,
  Swords,
  Shield,
  Users,
  Github,
  Instagram,
  Youtube,
} from "lucide-react";


type Standing = {
  pos: number;
  team: { name: string; slug?: string | null; shield_url?: string | null } | null;
  pts: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
};

type FinalMatch = {
  id: string;
  leg: number | null;
  local_score: number | null;
  away_score: number | null;
  match_date: string | null;
  match_time: string | null;
  status: string | null;
};

type Tie = {
  home: { team: { name: string; shield_url?: string | null } | null };
  away: { team: { name: string; shield_url?: string | null } | null };
  legs: FinalMatch[];
  aggregate: { home: number; away: number } | null;
} | null;

type GroupMatch = {
  id: string;
  group_name: "A" | "B" | null;
  local_team_id: string;
  away_team_id: string;
  local_score: number | null;
  away_score: number | null;
  status: string | null;
  match_date: string | null;
  match_time: string | null;
  jornada: number | null;
};

type FinalData = {
  groups: { A: Standing[]; B: Standing[] };
  groupMatches: GroupMatch[];
  bracket: { semifinals: Tie[]; final: Tie };
  status: string;
  updatedAt: string | null;
};

function formatTime12h(time: string | null) {
  if (!time) return null;
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time.slice(0, 5);

  const fakeDate = new Date();
  fakeDate.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(fakeDate);
}

function formatMatchDate(date: string | null, time: string | null) {
  if (!date) return "Por definir";
  const formatted = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));
  return time ? `${formatted} ${formatTime12h(time)}` : formatted;
}

function StandingsTable({ rows }: { rows: Standing[] }) {
  if (!rows.length) return <EmptyStandingsTable />;

  const columns: Array<{ key: string; label: string; mobileHidden?: boolean; align?: "left" | "center" }> = [
    { key: "pos", label: "#", align: "center" },
    { key: "equipo", label: "Equipo", align: "left" },
    { key: "pts", label: "PTS", align: "center" },
    { key: "pj", label: "PJ", align: "center" },
    { key: "pg", label: "PG", align: "center", mobileHidden: true },
    { key: "pe", label: "PE", align: "center", mobileHidden: true },
    { key: "pp", label: "PP", align: "center", mobileHidden: true },
    { key: "gf", label: "GF", align: "center", mobileHidden: true },
    { key: "gc", label: "GC", align: "center", mobileHidden: true },
    { key: "dif", label: "DIF", align: "center" },
  ];

  return (
    <div className="w-full min-w-0 rounded-xl border border-[color:var(--color-border)]/15 bg-[color:var(--color-card)]/8 overflow-hidden">
      <table className="w-full table-fixed text-xs md:text-sm">
        <thead>
          <tr className="border-b border-[color:var(--color-border)]/20 bg-[color:var(--color-card)]/20 text-[color:var(--color-foreground)]/65 uppercase tracking-wider">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`py-3 px-2 font-mono text-[10px] md:text-[11px] ${column.align === "left" ? "text-left" : "text-center"} ${column.mobileHidden ? "hidden sm:table-cell" : ""} ${column.key === "pos" ? "w-8" : ""} ${column.key === "equipo" ? "w-[45%] sm:w-auto" : ""}`}
                scope="col"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const isQualified = row.pos <= 2;
            return (
              <tr
                key={`${row.pos}-${row.team?.name}`}
                className={`border-b border-[color:var(--color-border)]/10 transition-colors ${isQualified ? "bg-[color:var(--color-primary)]/[0.05]" : index % 2 === 1 ? "bg-[color:var(--color-card)]/[0.04]" : "bg-transparent"}`}
              >
                <td className={`py-3 px-2 text-center font-black ${isQualified ? "text-[color:var(--color-primary)]" : ""}`}>
                  {row.pos}
                </td>
                <td className="py-3 px-2 font-medium">
                  <div className="flex min-w-0 items-center gap-2">
                    <TeamShield
                      teamName={row.team?.name ?? "Por definir"}
                      shieldUrl={row.team?.shield_url ?? undefined}
                      sizeClassName="h-7 w-7 md:h-8 md:w-8"
                    />
                    {row.team?.slug ? (
                      <a href={`/equipos/${row.team.slug}`} className="truncate text-[11px] md:text-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]">
                        {row.team.name}
                      </a>
                    ) : <span className="truncate text-[11px] md:text-sm">Por definir</span>}
                  </div>
                </td>
                <td className="text-center py-3 px-2 font-black text-[color:var(--color-primary)]">{row.pts}</td>
                <td className="text-center py-3 px-2">{row.pj}</td>
                <td className="hidden sm:table-cell text-center py-3 px-2">{row.pg}</td>
                <td className="hidden sm:table-cell text-center py-3 px-2">{row.pe}</td>
                <td className="hidden sm:table-cell text-center py-3 px-2">{row.pp}</td>
                <td className="hidden sm:table-cell text-center py-3 px-2">{row.gf}</td>
                <td className="hidden sm:table-cell text-center py-3 px-2">{row.gc}</td>
                <td className={`text-center py-3 px-2 font-semibold ${row.dif > 0 ? "text-[color:var(--color-success)]" : row.dif < 0 ? "text-[color:var(--color-danger)]" : "text-[color:var(--color-foreground)]/65"}`}>
                  {row.dif > 0 ? `+${row.dif}` : row.dif}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>


    </div>
  );
}

function RealBracketMatchup({ tie }: { tie: Tie }) {
  const home = tie?.home.team?.name ?? "Por definir";
  const away = tie?.away.team?.name ?? "Por definir";
  const legLabel = (match: FinalMatch, index: number, total: number) =>
    match.leg === 2 ? "Vuelta" : match.leg === 1 ? "Ida" : total > 1 ? (index === 0 ? "Ida" : "Vuelta") : "Ida";
  return <div className="min-w-0 bg-[color:var(--color-card)]/10 border border-[color:var(--color-border)]/20 rounded-xl p-4 md:p-5">
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2"><TeamShield teamName={home} shieldUrl={tie?.home.team?.shield_url ?? undefined} sizeClassName="h-9 w-9" /><span className="truncate font-medium">{home}</span></div><span className="text-[color:var(--color-foreground)]/40 font-mono text-xs">vs</span><div className="flex min-w-0 items-center justify-end gap-2"><span className="truncate text-right font-medium">{away}</span><TeamShield teamName={away} shieldUrl={tie?.away.team?.shield_url ?? undefined} sizeClassName="h-9 w-9" /></div>
    </div>
    <div className="mt-3 border-t border-[color:var(--color-border)]/10 pt-3 space-y-1">
      {tie?.legs.length ? tie.legs.map((match, index) => <div key={match.id} className="flex min-w-0 justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-foreground)]/60"><span className="min-w-0 truncate">{legLabel(match, index, tie.legs.length)}</span><strong className="shrink-0">{match.local_score ?? '—'} - {match.away_score ?? '—'}</strong></div>) : <span className="block text-center font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-foreground)]/30">Partidos por definir</span>}
      {tie?.aggregate && <div className="pt-2 text-center font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--color-primary)]">Global {tie.aggregate.home} - {tie.aggregate.away}</div>}
    </div>
  </div>;
}

function EmptyStandingsTable() {
  const rows = Array.from({ length: 4 });

  return (
    <div className="w-full min-w-0 rounded-xl border border-[color:var(--color-border)]/15 bg-[color:var(--color-card)]/8 overflow-hidden">
      <table className="w-full table-fixed text-xs md:text-sm">
        <thead>
          <tr className="border-b border-[color:var(--color-border)]/20 bg-[color:var(--color-card)]/20 text-[color:var(--color-foreground)]/60 uppercase tracking-wider">
            <th className="text-center py-3 px-2 font-mono text-[10px] md:text-[11px]">#</th>
            <th className="text-left py-3 px-2 font-mono text-[10px] md:text-[11px]">Equipo</th>
            <th className="text-center py-3 px-2 font-mono text-[10px] md:text-[11px]">PTS</th>
            <th className="text-center py-3 px-2 font-mono text-[10px] md:text-[11px]">PJ</th>
            <th className="hidden sm:table-cell text-center py-3 px-2 font-mono text-[10px] md:text-[11px]">PG</th>
            <th className="hidden sm:table-cell text-center py-3 px-2 font-mono text-[10px] md:text-[11px]">
              PE
            </th>
            <th className="hidden sm:table-cell text-center py-3 px-2 font-mono text-[10px] md:text-[11px]">
              PP
            </th>
            <th className="hidden sm:table-cell text-center py-3 px-2 font-mono text-[10px] md:text-[11px]">GF</th>
            <th className="hidden sm:table-cell text-center py-3 px-2 font-mono text-[10px] md:text-[11px]">GC</th>
            <th className="text-center py-3 px-2 font-mono text-[10px] md:text-[11px]">
              DIF
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((_, i) => (
            <tr
              key={i}
              className={`border-b border-[color:var(--color-border)]/10 ${i % 2 === 1 ? "bg-[color:var(--color-card)]/[0.04]" : "bg-transparent"}`}
            >
              <td className="py-3 px-2 text-[color:var(--color-foreground)]/30 text-center font-black">
                {i + 1}
              </td>
              <td className="py-3 px-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="h-6 w-6 md:h-7 md:w-7 rounded-full bg-[color:var(--color-border)]/20 border border-dashed border-[color:var(--color-border)]/30 flex items-center justify-center shrink-0" />
                  <span className="truncate text-[11px] md:text-sm text-[color:var(--color-foreground)]/30 font-medium tracking-tight">
                    ———
                  </span>
                </div>
              </td>
              <td className="text-center py-3 px-2 text-[color:var(--color-primary)]/45 font-black">
                —
              </td>
              <td className="text-center py-3 px-2 text-[color:var(--color-foreground)]/20">
                —
              </td>
              <td className="hidden sm:table-cell text-center py-3 px-2 text-[color:var(--color-foreground)]/20">
                —
              </td>
              <td className="hidden sm:table-cell text-center py-3 px-2 text-[color:var(--color-foreground)]/20">
                —
              </td>
              <td className="hidden sm:table-cell text-center py-3 px-2 text-[color:var(--color-foreground)]/20">
                —
              </td>
              <td className="hidden sm:table-cell text-center py-3 px-2 text-[color:var(--color-foreground)]/20">
                —
              </td>
              <td className="hidden sm:table-cell text-center py-3 px-2 text-[color:var(--color-foreground)]/20">
                —
              </td>
              <td className="text-center py-3 px-2 text-[color:var(--color-foreground)]/20">
                —
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchupSlot() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-[color:var(--color-border)]/15 border border-dashed border-[color:var(--color-border)]/30 flex items-center justify-center shrink-0">
        <Shield size={12} className="text-[color:var(--color-border)]/30" />
      </div>
      <span className="text-[color:var(--color-foreground)]/25 font-mono text-sm uppercase tracking-wider">
        Por definir
      </span>
    </div>
  );
}

function BracketMatchup() {
  return (
    <div className="bg-[color:var(--color-card)]/10 border border-dashed border-[color:var(--color-border)]/25 rounded-xl p-4 md:p-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <MatchupSlot />
          <span className="text-[color:var(--color-foreground)]/15 font-mono text-xs uppercase tracking-widest shrink-0">
            vs
          </span>
          <MatchupSlot />
        </div>
        <div className="flex items-center justify-center gap-4 md:gap-8 border-t border-[color:var(--color-border)]/10 pt-3">
          <span className="text-[color:var(--color-foreground)]/20 font-mono text-[10px] md:text-xs uppercase tracking-wider">
            Ida: —
          </span>
          <span className="text-[color:var(--color-border)]/30">|</span>
          <span className="text-[color:var(--color-foreground)]/20 font-mono text-[10px] md:text-xs uppercase tracking-wider">
            Vuelta: —
          </span>
        </div>
      </div>
    </div>
  );
}

function ConnectorLine() {
  return (
    <div className="flex justify-center py-1">
      <div className="w-px h-6 md:h-8 bg-[color:var(--color-border)]/15 border-l border-dashed border-[color:var(--color-border)]/25" />
    </div>
  );
}

function BracketConnector() {
  return (
    <div className="relative flex items-center justify-center py-2">
      <div className="hidden md:flex items-center w-full max-w-[500px]">
        <div className="flex-1 h-px bg-[color:var(--color-border)]/15 border-t border-dashed border-[color:var(--color-border)]/25" />
        <div className="w-px h-6 bg-[color:var(--color-border)]/15 border-l border-dashed border-[color:var(--color-border)]/25" />
        <div className="flex-1 h-px bg-[color:var(--color-border)]/15 border-t border-dashed border-[color:var(--color-border)]/25" />
      </div>
      <div className="md:hidden w-px h-6 bg-[color:var(--color-border)]/15 border-l border-dashed border-[color:var(--color-border)]/25" />
    </div>
  );
}

function formatUpdatedAt(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function CuadrangularesClient({ teams, data }: { teams: TeamInfo[]; data: FinalData | null }) {
  const [expandedGroups, setExpandedGroups] = useState<Record<"A" | "B", boolean>>({ A: false, B: false });

  const groupMatches = data?.groupMatches ?? [];

  const toggleGroup = (group: "A" | "B") => {
    setExpandedGroups((current) => ({
      ...current,
      [group]: !current[group],
    }));
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <SiteHeader teams={teams} />

      {/* Hero */}
      <section className="px-4 md:px-8 pt-28 pb-6 md:pt-20 md:pb-10">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center">
            <h1 className="font-serif text-3xl md:text-6xl lg:text-7xl font-black uppercase leading-none tracking-tight mb-3">
              Cuadrangular
              <span className="border-t-[color:var(--color-primary)] text-[color:var(--color-primary)]">
                /Final
              </span>
            </h1>
            <p className="font-mono text-sm md:text-base text-[color:var(--color-foreground)]/80">
              Tabla, resultados y próximos partidos
            </p>
            {data?.updatedAt && <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-foreground)]/45">Última actualización: {formatUpdatedAt(data.updatedAt)}</p>}
          </div>
        </div>
      </section>

      {/* Cuadrangulares */}
      <section className="px-4 md:px-8 pb-12 md:pb-16">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center gap-3 mb-6">
            <Users size={18} className="text-[color:var(--color-primary)]" />
            <h2 className="font-serif text-2xl md:text-3xl font-bold uppercase tracking-tight">
              Cuadrangulares
            </h2>

          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {(["A", "B"] as const).map((group) => {
              const rows = data?.groups[group] ?? [];
              const matches = groupMatches.filter((match) => match.group_name === group);
              return (
                <div key={group} id={`grupo-${group.toLowerCase()}`} className="min-w-0 space-y-4 scroll-mt-24">
                  <div className="min-w-0 overflow-hidden bg-[color:var(--color-card)]/10 border border-[color:var(--color-border)]/15 rounded-2xl p-4 md:p-6">
                    <h3 className="mb-4 font-serif text-xl font-bold">Grupo {group}</h3>
                    <StandingsTable rows={rows} />
                    <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-foreground)]/40">
                      {rows.length ? "Los dos primeros clasifican a semifinales" : "Aún no hay datos disponibles"}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-2xl border border-[color:var(--color-border)]/15 bg-[color:var(--color-card)]/8 p-4 md:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h4 className="min-w-0 truncate font-serif text-lg font-bold">Partidos del Grupo {group}</h4>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-foreground)]/45">{matches.length} registrados</span>
                    </div>

                    {matches.length ? (
                      <>
                        <button
                          type="button"
                          className="mb-3 inline-flex items-center gap-1.5 border-b border-[color:var(--color-primary)]/25 pb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary)] transition-colors hover:text-[color:var(--color-primary)]/80"
                          onClick={() => toggleGroup(group)}
                          aria-expanded={expandedGroups[group]}
                          aria-controls={`group-matches-${group}`}
                        >
                          <span>{expandedGroups[group] ? "Ocultar" : "Ver"}</span>
                          <span>{matches.length}</span>
                          <span>{expandedGroups[group] ? "partidos" : "partidos"}</span>
                        </button>

                        {expandedGroups[group] && (
                          <div id={`group-matches-${group}`} className="space-y-3">
                            {matches.map((match) => {
                              const localTeam = teams.find((team) => String(team.id) === match.local_team_id);
                              const awayTeam = teams.find((team) => String(team.id) === match.away_team_id);
                              const local = localTeam?.name ?? "Por definir";
                              const away = awayTeam?.name ?? "Por definir";
                              const resultText = match.local_score !== null && match.away_score !== null ? `${match.local_score}–${match.away_score}` : formatMatchDate(match.match_date, match.match_time);

                              return (
                                <div key={match.id} className="min-w-0 rounded-xl border border-[color:var(--color-border)]/10 bg-[color:var(--color-card)]/10 p-3">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {/* Local team */}
                                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                      <TeamShield teamName={local} shieldUrl={localTeam?.shield_url ?? undefined} sizeClassName="h-7 w-7 shrink-0" />
                                      <span className="min-w-0 truncate text-sm font-semibold">{local}</span>
                                    </div>

                                    {/* Score/Date - centered */}
                                    <div className="max-w-[38%] shrink-0 truncate rounded-full border border-[color:var(--color-border)]/15 bg-[color:var(--color-primary)]/[0.08] px-2 py-1 font-mono text-[10px] font-black tracking-tight text-[color:var(--color-primary)]">
                                      {resultText}
                                    </div>

                                    {/* Away team */}
                                    <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                                      <span className="min-w-0 truncate text-right text-sm font-semibold">{away}</span>
                                      <TeamShield teamName={away} shieldUrl={awayTeam?.shield_url ?? undefined} sizeClassName="h-7 w-7 shrink-0" />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="font-mono text-xs text-[color:var(--color-foreground)]/45">No hay partidos registrados para este grupo.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bracket Section */}
      <section className="px-4 md:px-8 pb-12 md:pb-16">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Swords size={18} className="text-[color:var(--color-primary)]" />
            <h2 className="font-serif text-2xl md:text-3xl font-bold uppercase tracking-tight">
              Eliminatorias
            </h2>
          </div>

          {/* Semifinales */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-6">
              <h3 className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-primary)]/80">
                Semifinales
              </h3>
              <div className="h-px flex-1 bg-[color:var(--color-border)]/10" />
              <span className="font-mono text-[10px] uppercase tracking-widest bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]/60 border border-[color:var(--color-primary)]/20 rounded-full px-2.5 py-0.5">
                Ida / Vuelta
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 md:relative">
              <RealBracketMatchup tie={data?.bracket.semifinals[0] ?? null} />
              <RealBracketMatchup tie={data?.bracket.semifinals[1] ?? null} />
            </div>

            <BracketConnector />
          </div>

          {/* Gran Final */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h3 className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-primary)]/80">
                Gran Final
              </h3>
              <div className="h-px flex-1 bg-[color:var(--color-border)]/10" />
              <span className="font-mono text-[10px] uppercase tracking-widest bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]/60 border border-[color:var(--color-primary)]/20 rounded-full px-2.5 py-0.5">
                Ida / Vuelta
              </span>
            </div>

            <div className="max-w-lg mx-auto">
              <RealBracketMatchup tie={data?.bracket.final ?? null} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[color:var(--color-border)]/20 py-5 px-4 md:px-8">
        <div className="container mx-auto flex items-center justify-between gap-4">

          {/* Izquierda: identidad */}
          <div className="flex items-center gap-2 shrink-0">
            <img src="/icon.webp" alt="Liga F" className="h-7 w-7 rounded-full" />
            <div className="hidden sm:block">
              <p className="font-serif text-sm font-bold uppercase leading-none">Liga F</p>
              <p className="font-mono text-[10px] text-[color:var(--color-foreground-muted)] mt-0.5">Fútbol femenino colombiano</p>
            </div>
            <p className="sm:hidden font-serif text-sm font-bold uppercase">Liga F</p>
          </div>

          {/* Centro: socials */}
          <div className="flex gap-1.5">
            {[
              { Icon: Github, href: "https://github.com/offluisangel", label: "GitHub" },
              { Icon: Youtube, href: "https://www.youtube.com/@winsportstv/streams", label: "Youtube" },
              { Icon: Instagram, href: "https://www.instagram.com/offluisangel", label: "Instagram" },
            ].map(({ Icon, href, label }, i) => (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[color:var(--color-muted)]/10 text-[color:var(--color-foreground)] rounded-full hover:bg-[color:var(--color-primary)] hover:text-[color:var(--color-primary-foreground)] transition-colors"
                aria-label={label}
              >
                <Icon size={16} />
              </a>
            ))}
          </div>

          {/* Derecha: temporada */}
          <p className="font-mono text-[10px] text-[color:var(--color-foreground-muted)] shrink-0">Temporada 2026</p>
        </div>
      </footer>
    </main>
  );
}
