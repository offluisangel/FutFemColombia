"use client";

import { TeamShield } from "@/components/liga/team-shield";
import { TeamStats } from "@/components/liga/team-stats";
import { SiteHeader, type TeamInfo } from "@/components/liga/site-header";
import { ChampionConfetti } from "@/components/liga/champion-confetti";
import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { formatMatchDate } from "@/lib/format-date";

interface TeamStanding {
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

interface ResultMatch {
  local: string;
  shield_local: string;
  visitante: string;
  shield_away: string;
  golesLocal: number;
  golesVisitante: number;
  hora: string;
  fecha: string;
  jornada: number;
  phase: string;
  leg: number | null;
}

interface UpcomingMatch {
  local: string;
  shield_local: string;
  visitante: string;
  shield_away: string;
  fecha: string;
  hora: string;
  jornada: number;
  phase: string;
  leg: number | null;
}

function phaseLabel(phase: string, leg: number | null, jornada: number): string {
  if (phase === "final") {
    return `Gran Final — ${leg === 2 || jornada === 2 ? "Vuelta" : "Ida"}`;
  }
  if (phase === "semifinal") {
    return `Semifinal — ${leg === 2 || jornada === 2 ? "Vuelta" : "Ida"}`;
  }
  return `Jornada ${jornada}`;
}

interface TeamPageClientProps {
  info: { nombreCompleto: string; slug: string; ciudad: string };
  team: TeamStanding;
  standings: TeamStanding[];
  description: string;
  recentResults: ResultMatch[];
  upcomingMatches: UpcomingMatch[];
  competitionStatus: "active" | "eliminated" | "champion";
  shieldUrl: string;
  teams: TeamInfo[];
}

export function TeamPageClient({
  info,
  team,
  standings,
  description,
  recentResults,
  upcomingMatches,
  competitionStatus,
  shieldUrl,
  teams,
}: TeamPageClientProps) {
  const isActive = competitionStatus === "active";
  const isChampion = competitionStatus === "champion";
  const statusLabel = isChampion
    ? "Campeón 2026"
    : isActive
      ? "En competencia"
      : "Participación finalizada";
  const statusClass = isChampion
    ? "bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)]"
    : isActive
      ? "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]"
      : "bg-[color:var(--color-muted)]/25 text-[color:var(--color-foreground-muted)]";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[color:var(--color-background)] text-[color:var(--color-foreground)] selection:bg-[color:var(--color-primary)]/30">
      <SiteHeader teams={teams} />
      {isChampion && <ChampionConfetti />}
      <div className="mx-auto max-w-7xl space-y-6 px-4 pb-10 pt-24 md:px-8 md:pt-20">
        <section className="overflow-hidden rounded-2xl border border-[color:var(--color-border)]/25 bg-[color:var(--color-card)]/20 shadow-sm" aria-labelledby="team-title">
          <div className="grid md:grid-cols-[12rem_minmax(0,1fr)] lg:grid-cols-[14rem_minmax(0,1fr)]">
            <div className="flex items-center justify-center border-b border-[color:var(--color-border)]/20 bg-[color:var(--color-primary)]/[0.06] px-6 py-6 md:border-b-0 md:border-r md:px-5 md:py-7">
              <div className="flex items-center gap-4 text-center md:flex-col">
                <TeamShield
                  teamName={team.name}
                  shieldUrl={shieldUrl}
                  sizeClassName="h-24 w-24 md:h-28 md:w-28"
                  tone="primary"
                />
                <span className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-foreground-muted)]">
                  <MapPin size={12} className="text-[color:var(--color-primary)]" aria-hidden="true" />
                  {info.ciudad}
                </span>
              </div>
            </div>

            <div className="flex min-w-0 flex-col justify-center p-5 md:p-7 lg:p-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${statusClass}`}>
                  {statusLabel}
                </span>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-foreground-muted)]">
                  Liga Femenina 2026
                </span>
              </div>

              <h1 id="team-title" className="mt-3 w-full text-balance font-serif text-[clamp(2.35rem,4.5vw,4.5rem)] font-black uppercase leading-[0.9] tracking-[-0.03em]">
                {info.nombreCompleto}
              </h1>
              <p className="mt-4 w-full font-mono text-sm leading-6 text-[color:var(--color-foreground)]/80">
                {description}
              </p>

              <div className="mt-5 grid grid-cols-3 border-t border-[color:var(--color-border)]/25 pt-4 font-mono tabular-nums">
                <div>
                  <span className="block font-serif text-2xl font-black text-[color:var(--color-primary)] md:text-3xl">{team.pos}°</span>
                  <span className="mt-0.5 block text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-foreground-muted)]">Posición</span>
                </div>
                <div className="border-x border-[color:var(--color-border)]/20 px-4 md:px-5">
                  <span className="block font-serif text-2xl font-black md:text-3xl">{team.pts}</span>
                  <span className="mt-0.5 block text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-foreground-muted)]">Puntos</span>
                </div>
                <div className="pl-4 md:pl-5">
                  <span className="block font-serif text-2xl font-black md:text-3xl">{team.pj}</span>
                  <span className="mt-0.5 block text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-foreground-muted)]">Partidos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <TeamStats team={team} />

        <section className="grid gap-6 md:grid-cols-2" aria-label="Calendario y resultados del equipo">
          <section className="overflow-hidden rounded-2xl border border-[color:var(--color-border)]/30 bg-[color:var(--color-card)]/15" aria-labelledby="recent-results-title">
            <div className="flex items-end justify-between gap-4 border-b border-[color:var(--color-border)]/25 p-5 md:p-6">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-primary)]">Últimas jornadas</p>
                <h2 id="recent-results-title" className="mt-1 font-serif text-2xl font-bold uppercase tracking-[-0.02em]">Resultados recientes</h2>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-[color:var(--color-foreground-muted)]">{recentResults.length} partidos</span>
            </div>
            {recentResults.length === 0 ? (
              <div className="p-8 text-center font-mono text-sm leading-6 text-[color:var(--color-foreground-muted)]">
                Aún no hay resultados registrados para este equipo.
              </div>
            ) : (
              <div className="divide-y divide-[color:var(--color-border)]/10">
                {recentResults.map((match, i) => {
                  const isLocal = match.local === team.name;
                  const teamScore = isLocal
                    ? match.golesLocal
                    : match.golesVisitante;
                  const opponentScore = isLocal
                    ? match.golesVisitante
                    : match.golesLocal;
                  const won = teamScore > opponentScore;
                  const lost = teamScore < opponentScore;

                  return (
                    <div key={`${match.fecha}-${match.local}-${i}`} className="group p-4 transition-colors hover:bg-[color:var(--color-primary)]/5 md:p-5">
                      <span className="mb-3 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-primary)]">
                        <CalendarDays size={13} aria-hidden="true" /> {phaseLabel(match.phase, match.leg, match.jornada)}<span className="sr-only">, </span>{match.fecha && formatMatchDate(match.fecha, match.hora)}
                      </span>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 md:gap-4" aria-label={`${match.local} ${match.golesLocal}, ${match.visitante} ${match.golesVisitante}`}>
                        <div className="flex items-center gap-1.5 md:gap-2 min-w-0 justify-end">
                          <span
                            className={`font-mono text-xs md:text-sm truncate ${
                              isLocal
                                ? "font-bold text-[color:var(--color-foreground)]"
                                : "text-[color:var(--color-foreground-muted)]"
                            }`}
                          >
                            {match.local}
                          </span>
                          <TeamShield
                            teamName={match.local}
                            shieldUrl={match.shield_local}
                            sizeClassName="h-6 w-6 md:h-7 md:w-7 shrink-0"
                            tone={
                              isLocal ? (won ? "primary" : "primary") : "muted"
                            }
                          />
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <span
                            className={`font-mono text-base md:text-lg font-bold ${
                              isLocal
                                ? won
                                  ? "text-[color:var(--color-success)]"
                                  : lost
                                    ? "text-[color:var(--color-danger)]"
                                    : "text-[color:var(--color-foreground)]"
                                : won
                                  ? "text-[color:var(--color-danger)]"
                                  : lost
                                    ? "text-[color:var(--color-success)]"
                                    : "text-[color:var(--color-foreground)]"
                            }`}
                          >
                            {match.golesLocal}
                          </span>
                          <span className="font-mono text-[color:var(--color-foreground)]/30">
                            -
                          </span>
                          <span
                            className={`font-mono text-base md:text-lg font-bold ${
                              isLocal
                                ? lost
                                  ? "text-[color:var(--color-success)]"
                                  : won
                                    ? "text-[color:var(--color-danger)]"
                                    : "text-[color:var(--color-foreground)]"
                                : won
                                  ? "text-[color:var(--color-success)]"
                                  : lost
                                    ? "text-[color:var(--color-danger)]"
                                    : "text-[color:var(--color-foreground)]"
                            }`}
                          >
                            {match.golesVisitante}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                          <TeamShield
                            teamName={match.visitante}
                            shieldUrl={match.shield_away}
                            sizeClassName="h-6 w-6 md:h-7 md:w-7 shrink-0"
                            tone={
                              !isLocal ? (won ? "primary" : "muted") : "muted"
                            }
                          />
                          <span
                            className={`font-mono text-xs md:text-sm truncate ${
                              !isLocal
                                ? "font-bold text-[color:var(--color-foreground)]"
                                : "text-[color:var(--color-foreground-muted)]"
                            }`}
                          >
                            {match.visitante}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-[color:var(--color-border)]/30 bg-[color:var(--color-card)]/15" aria-labelledby="upcoming-matches-title">
            <div className="flex items-end justify-between gap-4 border-b border-[color:var(--color-border)]/25 p-5 md:p-6">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-primary)]">Agenda</p>
                <h2 id="upcoming-matches-title" className="mt-1 font-serif text-2xl font-bold uppercase tracking-[-0.02em]">Próximos partidos</h2>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-[color:var(--color-foreground-muted)]">{upcomingMatches.length} programados</span>
            </div>
            {upcomingMatches.length === 0 ? (
              <div className="p-8 text-center font-mono text-sm leading-6 text-[color:var(--color-foreground-muted)]">
                El calendario de próximos partidos aún está por confirmar.
              </div>
            ) : (
              <div className="divide-y divide-[color:var(--color-border)]/10">
                {upcomingMatches.map((match, i) => {
                  const isLocal = match.local === team.name;

                  return (
                    <div key={`${match.fecha}-${match.local}-${i}`} className="group p-4 transition-colors hover:bg-[color:var(--color-primary)]/5 md:p-5">
                      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 md:gap-4">
                        <div className="flex items-center gap-1.5 md:gap-2 min-w-0 justify-end">
                          <span
                            className={`font-mono text-xs md:text-sm truncate ${
                              isLocal
                                ? "font-bold text-[color:var(--color-foreground)]"
                                : "text-[color:var(--color-foreground-muted)]"
                            }`}
                          >
                            {match.local}
                          </span>
                          <TeamShield
                            teamName={match.local}
                            shieldUrl={match.shield_local}
                            sizeClassName="h-6 w-6 md:h-7 md:w-7 shrink-0"
                            tone={isLocal ? "primary" : "muted"}
                          />
                        </div>

                        <span className="font-serif text-xs text-[color:var(--color-foreground)]/20 font-bold px-1">
                          VS
                        </span>

                        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                          <TeamShield
                            teamName={match.visitante}
                            shieldUrl={match.shield_away}
                            sizeClassName="h-6 w-6 md:h-7 md:w-7 shrink-0"
                            tone={!isLocal ? "primary" : "muted"}
                          />
                          <span
                            className={`font-mono text-xs md:text-sm truncate ${
                              !isLocal
                                ? "font-bold text-[color:var(--color-foreground)]"
                                : "text-[color:var(--color-foreground-muted)]"
                            }`}
                          >
                            {match.visitante}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-primary)]">
                          <CalendarDays size={13} aria-hidden="true" /> {phaseLabel(match.phase, match.leg, match.jornada)}<span className="sr-only">, </span>{match.fecha && formatMatchDate(match.fecha, match.hora)}
                        </span>
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(match.local)}+vs+${encodeURIComponent(match.visitante)}+Liga+Femenina+2026`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-border)]/20 bg-[color:var(--color-muted)]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-foreground-muted)] hover:bg-[color:var(--color-primary)] hover:text-[color:var(--color-primary-foreground)] transition-colors shrink-0"
                        >
                          <ExternalLink size={10} />
                          Ver
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
