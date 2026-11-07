"use client";

import { useState, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { motion } from "framer-motion";
import { StandingsTable, type TeamStanding } from "@/components/liga/standings-table";
import { MatchCalendar, type Matchday } from "@/components/liga/match-calendar";
import type { UpcomingMatch } from "@/components/liga/upcoming-matches";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteHeader, type TeamInfo } from "@/components/liga/site-header";
import { ScorersTable, type Scorer } from "@/components/liga/scorers-table";
import { buildSeasonLabel, seasonYear } from "@/lib/season";
import { filterHomeMatchdays, selectHomeUpcomingPhase, type HomeCalendarFilter, type HomeUpcomingPhase } from "@/lib/liga/home-calendar-filter";
import { CalendarSubscription } from "@/components/liga/calendar-actions";
import { HomeScorerHighlights } from "@/components/liga/home-scorer-highlights";
import { formatMatchDate } from "@/lib/format-date";
import { buildMatchYoutubeSearchUrl } from "@/lib/youtube-search";
import { TeamShield } from "@/components/liga/team-shield";
import styles from "@/components/liga/home-tabs.module.css";
import {
  Calendar,
  Trophy,
  Icon,
  ArrowRight,
} from "lucide-react";
import { soccerBall } from "@lucide/lab";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function OverviewFixtures({
  upcoming,
  nextJornada,
  seasonYear: year,
}: {
  upcoming: UpcomingMatch[];
  nextJornada: number | null;
  seasonYear: number;
}) {
  const matches = upcoming.filter((match) => match.jornada === nextJornada);

  if (matches.length === 0) {
    return <p className="font-mono text-sm text-[color:var(--color-foreground-muted)]">No hay encuentros próximos disponibles.</p>;
  }

  return (
    <ul className="divide-y divide-[color:var(--color-border)]/30">
      {matches.map((match, index) => (
        <li key={`${match.jornada}-${match.local}-${match.visitante}-${index}`} className="py-4 first:pt-0 last:pb-0">
          <p className="mb-3 font-mono text-xs text-[color:var(--color-foreground-muted)]">
            {formatMatchDate(match.fecha, match.hora)}
            {match.phase_label ? ` · ${match.phase_label}` : match.group_name ? ` · Grupo ${match.group_name}` : ""}
          </p>
          <div className="flex items-center gap-3">
            <TeamShield teamName={match.local} shieldUrl={match.shield_local} sizeClassName="h-8 w-8" />
            <span className="min-w-0 flex-1 font-mono text-sm">{match.local}</span>
            <span className="font-serif text-xs text-[color:var(--color-foreground-muted)]">VS</span>
            <span className="min-w-0 flex-1 text-right font-mono text-sm">{match.visitante}</span>
            <TeamShield teamName={match.visitante} shieldUrl={match.shield_away} sizeClassName="h-8 w-8" tone="muted" />
          </div>
          <a href={buildMatchYoutubeSearchUrl(match.local, match.visitante, year)} target="_blank" rel="noreferrer" className="mt-3 inline-block font-mono text-xs text-[color:var(--color-primary)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]">
            Buscar transmisión
          </a>
        </li>
      ))}
    </ul>
  );
}

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

// Píldora de tab con indicador deslizante (layoutId) sobre track hundido.
// "reduced" desactiva el deslizamiento: el indicador aparece instantáneo.
function TabPill({
  value,
  active,
  reduced,
  children,
}: {
  value: string;
  active: boolean;
  reduced: boolean;
  children: ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      className={`relative rounded-full px-3 md:px-6 py-1.5 md:py-2 font-mono text-xs md:text-sm uppercase flex items-center transition-[color,transform] duration-150 active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)] ${
        active
          ? "text-[color:var(--color-primary-foreground)] dark:text-[color:var(--color-primary-foreground)]"
          : "text-[color:var(--color-foreground)]/60 dark:text-[color:var(--color-foreground)]/60 hover:text-[color:var(--color-foreground)]/90 dark:hover:text-[color:var(--color-foreground)]/90"
      }`}
    >
      {active && !reduced && (
        <motion.span
          layoutId="tab-active-indicator"
          className="absolute inset-0 rounded-full bg-[color:var(--color-primary)] shadow-[0_0_0_1px_rgba(243,113,226,0.25),0_4px_18px_-2px_rgba(243,113,226,0.5)]"
          transition={{ type: "spring", stiffness: 440, damping: 34, mass: 0.9 }}
        />
      )}
      {active && reduced && (
        <span className="absolute inset-0 rounded-full bg-[color:var(--color-primary)] shadow-[0_0_0_1px_rgba(243,113,226,0.25),0_4px_18px_-2px_rgba(243,113,226,0.5)]" />
      )}
      <span className="relative z-10 flex items-center gap-1 md:gap-2">{children}</span>
    </TabsTrigger>
  );
}

function PhasePill({
  active,
  reduced,
  onClick,
  children,
}: {
  active: boolean;
  reduced: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative rounded-full px-3 sm:px-4 py-1.5 font-mono text-xs uppercase tracking-wider flex items-center transition-[color,transform] duration-150 active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)] ${
        active
          ? "text-[color:var(--color-primary-foreground)] dark:text-[color:var(--color-primary-foreground)]"
          : "text-[color:var(--color-foreground)]/60 dark:text-[color:var(--color-foreground)]/60 hover:text-[color:var(--color-foreground)]/90 dark:hover:text-[color:var(--color-foreground)]/90"
      }`}
    >
      {active && !reduced && (
        <motion.span
          layoutId="fechas-active-indicator"
          className="absolute inset-0 rounded-full bg-[color:var(--color-primary)] shadow-[0_0_0_1px_rgba(243,113,226,0.25),0_4px_18px_-2px_rgba(243,113,226,0.5)]"
          transition={{ type: "spring", stiffness: 440, damping: 34, mass: 0.9 }}
        />
      )}
      {active && reduced && (
        <span className="absolute inset-0 rounded-full bg-[color:var(--color-primary)] shadow-[0_0_0_1px_rgba(243,113,226,0.25),0_4px_18px_-2px_rgba(243,113,226,0.5)]" />
      )}
      <span className="relative z-10 flex items-center gap-1">{children}</span>
    </button>
  );
}

function AnimatedCounter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let rafId: number;
    const start = performance.now();
    const duration = 800;
    const from = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + (value - from) * eased));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, reduced]);
  return <span className={className}>{reduced ? value : count}</span>;
}

function CalendarPhase({ matchdays, phaseLabel, subscriptionHref, phaseKey }: { matchdays: Matchday[]; phaseLabel?: string; subscriptionHref: string; phaseKey: string }) {
  if (matchdays.length === 0) return (
    <div key={phaseKey} className="rounded-2xl border border-[color:var(--color-border)]/20 bg-[color:var(--color-card)]/12 p-6 text-center">
      <p className="font-mono text-sm text-[color:var(--color-foreground-muted)]">No hay partidos para este filtro.</p>
      <div className="mt-4 flex justify-center"><CalendarSubscription href={subscriptionHref} /></div>
    </div>
  );
  return <MatchCalendar key={phaseKey} matchdays={matchdays} phaseLabel={phaseLabel} subscriptionHref={subscriptionHref} />;
}

interface HomePageClientProps {
  teams: TeamInfo[];
  standings: TeamStanding[];
  scorers: Scorer[];
  matchdays: Matchday[];
  upcoming: UpcomingMatch[];
  nextJornada: number | null;
  cuadrangularMatchdays?: Matchday[];
  cuadrangularUpcoming?: (UpcomingMatch & { group_name?: string | null })[];
  semifinalMatchdays?: Matchday[];
  finalMatchdays?: Matchday[];
  knockoutUpcoming?: (UpcomingMatch & { group_name?: string | null; phase_label?: string | null })[];
  finalStageActive?: boolean;
  finalStageStatus?: string | null;
  seasonName?: string | null;
  calendarUrl?: string;
  children?: React.ReactNode;
}

type FechasPhase = HomeUpcomingPhase;

export function HomePageClient({
  teams,
  standings,
  scorers,
  matchdays,
  upcoming,
  nextJornada,
  cuadrangularMatchdays = [],
  cuadrangularUpcoming = [],
  semifinalMatchdays = [],
  finalMatchdays = [],
  knockoutUpcoming = [],
  finalStageActive = false,
  finalStageStatus = null,
  seasonName = null,
  calendarUrl = "/api/calendar",
  children,
}: HomePageClientProps) {
  const [activeTab, setActiveTab] = useState("resumen");
  const [calendarFilter, setCalendarFilter] = useState<HomeCalendarFilter>("all");
  const reduced = useReducedMotion();
  const hasCuadrangular = cuadrangularMatchdays.length > 0 || cuadrangularUpcoming.length > 0;
  const hasSemifinales = semifinalMatchdays.length > 0;
  const hasGranFinal = finalMatchdays.length > 0;
  const hasExtraFechas = hasCuadrangular || hasSemifinales || hasGranFinal;
  const hasKnockout = knockoutUpcoming.length > 0;
  const isRegularFinished = upcoming.length === 0 && matchdays.length > 0;
  const showFinalBanner = finalStageActive;
  const seasonYearLabel = seasonYear(seasonName);
  const finalStageHeading =
    finalStageStatus === "final_running"
      ? `Final ${seasonYearLabel}`
      : finalStageStatus === "semifinals_running"
        ? `Semifinales ${seasonYearLabel}`
        : `Cuadrangulares ${seasonYearLabel}`;
  const [fechasPhase, setFechasPhase] = useState<FechasPhase>(() =>
    hasGranFinal
      ? "final"
      : hasSemifinales
        ? "semifinales"
        : hasCuadrangular && isRegularFinished
          ? "cuadrangular"
          : "regular",
  );

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <SiteHeader teams={teams} />

      <section className="px-4 pt-28 pb-8 md:px-8 md:pt-20" aria-labelledby="page-title">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="mb-2 font-mono text-xs text-[color:var(--color-primary)]">{buildSeasonLabel(seasonName)}</p>
              <h1 id="page-title" className="max-w-3xl font-serif text-4xl font-bold leading-tight tracking-tight">
                Liga Femenina de <span className="text-[color:var(--color-primary)]">Colombia</span>
              </h1>
              <p className="mt-3 max-w-2xl font-mono text-sm text-[color:var(--color-foreground-muted)] md:text-base">
                Sigue el fútbol femenino colombiano. Resultados en vivo, clasificación actualizada y el calendario completo de la liga.
              </p>
            </div>
            <button type="button" onClick={() => { setActiveTab("calendario"); setCalendarFilter("upcoming"); setFechasPhase(selectHomeUpcomingPhase({ knockoutUpcoming, cuadrangularUpcoming, upcoming, finalMatchdays, semifinalMatchdays, cuadrangularMatchdays, regularMatchdays: matchdays })); }} className="inline-flex w-fit items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-5 py-3 font-mono text-xs font-semibold uppercase text-[color:var(--color-primary-foreground)] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)]">
              Ver todos los partidos <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {showFinalBanner && (
        <section className="px-4 md:px-8 pb-8" aria-labelledby="fase-final-heading">
          <div className="container mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-2xl border border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/[0.08] p-5 md:flex md:items-center md:justify-between md:gap-8 md:p-6">
              <div className="relative">
                <h2 id="fase-final-heading" className="mt-1 font-serif text-2xl font-bold uppercase tracking-tight md:text-3xl">{finalStageHeading}</h2>
                <p className="mt-2 max-w-xl font-mono text-xs leading-relaxed text-[color:var(--color-foreground)]/70 md:text-sm">
                  La fase regular terminó. Sigue aquí los grupos, llaves, resultados y cruces por el título.
                </p>
              </div>
              <a href="/cuadrangulares" className="relative mt-5 inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[color:var(--color-primary)] px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[color:var(--color-primary-foreground)] transition-transform hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)] md:mt-0">
                Ver fase final
                <ArrowRight size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Main Content with Tabs */}
      <section className="flex-1 px-4 md:px-8 pb-12">
        <div className="container mx-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full max-w-6xl mx-auto"
          >
            <TabsList className="w-full md:w-auto rounded-full border border-[color:var(--color-border)]/25 bg-[color:var(--color-card)]/10 p-1.5 mb-4 flex flex-nowrap justify-center gap-1.5 md:gap-2 overflow-x-auto shadow-[inset_0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)] scrollbar-none">
              <TabPill value="resumen" active={activeTab === "resumen"} reduced={reduced}>
                <Trophy size={14} className="md:w-4 md:h-4" />
                Resumen
              </TabPill>
              <TabPill value="goleadoras" active={activeTab === "goleadoras"} reduced={reduced}>
                <Icon iconNode={soccerBall} size={14} className="md:w-4 md:h-4" />
                <span className="hidden sm:inline">Goleadoras</span>
                <span className="sm:hidden">Goles</span>
              </TabPill>
              <TabPill value="calendario" active={activeTab === "calendario"} reduced={reduced}>
                <Calendar size={14} className="md:w-4 md:h-4" />
                Calendario
              </TabPill>
            </TabsList>

            <TabsContent value="resumen" className="mt-0">
              <motion.div
                key={`tab-${activeTab === "resumen"}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]"
              >
                <section id="proximos-partidos" aria-labelledby="upcoming-title" className="order-1 min-w-0 rounded-2xl bg-[var(--lavender-950)] p-5 md:p-6 lg:order-2">
                  <div className="mb-4 flex items-baseline justify-between gap-3">
                    <h2 id="upcoming-title" className="font-serif text-2xl font-bold">Próximos partidos</h2>
                    <button type="button" onClick={() => { setActiveTab("calendario"); setCalendarFilter("all"); }} className="font-mono text-xs text-[color:var(--color-foreground-muted)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]">Ver calendario</button>
                  </div>
                  {hasKnockout ? (
                    <>
                      <p className="mb-3 font-mono text-xs uppercase text-[color:var(--color-primary)]">{knockoutUpcoming[0]?.phase_label ?? "Eliminatorias"}</p>
                      <OverviewFixtures upcoming={knockoutUpcoming} nextJornada={knockoutUpcoming[0]?.jornada ?? null} seasonYear={seasonYearLabel} />
                    </>
                  ) : cuadrangularUpcoming.length > 0 ? (
                    <>
                      <p className="mb-3 font-mono text-xs uppercase text-[color:var(--color-primary)]">Cuadrangulares</p>
                      <OverviewFixtures upcoming={cuadrangularUpcoming} nextJornada={cuadrangularUpcoming[0]?.jornada ?? null} seasonYear={seasonYearLabel} />
                    </>
                  ) : (
                    <OverviewFixtures upcoming={upcoming} nextJornada={nextJornada} seasonYear={seasonYearLabel} />
                  )}
                </section>
                <section aria-labelledby="classification-title" className="order-2 min-w-0 overflow-x-auto lg:order-1">
                  <div className="mb-4 flex items-baseline justify-between gap-3">
                    <h2 id="classification-title" className="font-serif text-2xl font-bold">Clasificación</h2>
                    <span className="rounded-lg bg-[color:var(--color-card)] px-3 py-1 font-mono text-xs">Regular</span>
                  </div>
                  <StandingsTable teams={standings} />
                </section>
              </motion.div>
            </TabsContent>

            <TabsContent value="goleadoras" className={`mt-0 ${styles.scorers}`}>
              <motion.div
                key={`tab-${activeTab === "goleadoras"}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <HomeScorerHighlights scorers={scorers} />
                <ScorersTable scorers={scorers} seasonYear={seasonYearLabel} />
              </motion.div>
            </TabsContent>

            <TabsContent value="calendario" className={`mt-3 sm:mt-4 ${styles.calendar}`}>
              <motion.div
                key={`tab-${activeTab === "calendario"}-${fechasPhase}-${calendarFilter}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className={styles.filters} role="group" aria-label="Filtrar partidos">
                  {([['all', 'Todas'], ['upcoming', 'Próximos'], ['results', 'Resultados']] as const).map(([filter, label]) => (
                    <button key={filter} type="button" aria-pressed={calendarFilter === filter} onClick={() => setCalendarFilter(filter)} className={`${styles.filterButton} rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)] ${calendarFilter === filter ? "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]" : "text-[color:var(--color-foreground)]/60 hover:text-[color:var(--color-foreground)]"}`}>{label}</button>
                  ))}
                </div>
                {hasExtraFechas && (
                  <div className={styles.phaseGroup}>
                    <div className={styles.phasePills}>
                      <PhasePill active={fechasPhase === "regular"} reduced={reduced} onClick={() => setFechasPhase("regular")}>
                        Regular
                      </PhasePill>
                      {hasCuadrangular && (
                        <PhasePill active={fechasPhase === "cuadrangular"} reduced={reduced} onClick={() => setFechasPhase("cuadrangular")}>
                          <span className="hidden sm:inline">Cuadrangulares</span>
                          <span className="sm:hidden">Cuadra.</span>
                        </PhasePill>
                      )}
                      {hasSemifinales && (
                        <PhasePill active={fechasPhase === "semifinales"} reduced={reduced} onClick={() => setFechasPhase("semifinales")}>
                          <span className="hidden sm:inline">Semifinales</span>
                          <span className="sm:hidden">Semis.</span>
                        </PhasePill>
                      )}
                      {hasGranFinal && (
                        <PhasePill active={fechasPhase === "final"} reduced={reduced} onClick={() => setFechasPhase("final")}>
                          Final
                        </PhasePill>
                      )}
                    </div>
                    <a href="/cuadrangulares" className="font-mono text-xs text-[color:var(--color-primary)] hover:underline hidden sm:block">
                      Ver fase final →
                    </a>
                  </div>
                )}
                {fechasPhase === "regular" ? (
                  <>
                    <div className={styles.fixtureSurface}><CalendarPhase matchdays={filterHomeMatchdays(matchdays, calendarFilter)} phaseLabel={undefined} subscriptionHref={calendarUrl} phaseKey={`regular-${calendarFilter}`} /></div>
                    {hasExtraFechas && (
                      <p className="text-center font-mono text-xs text-[color:var(--color-foreground)]/45">
                        Fase regular finalizada — 16 fechas. <a href="/cuadrangulares" className="text-[color:var(--color-primary)] underline">Ver fase final</a>
                      </p>
                    )}
                  </>
                ) : fechasPhase === "cuadrangular" ? (
                  <>
                    {cuadrangularMatchdays.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[color:var(--color-border)]/25 bg-[color:var(--color-card)]/10 p-8 text-center">
                        <p className="font-mono text-sm text-[color:var(--color-foreground)]/60">Cuadrangulares por iniciar</p>
                        <a href="/cuadrangulares" className="mt-2 inline-block font-mono text-xs text-[color:var(--color-primary)] hover:underline">Ver grupos y estado →</a>
                        <div className="mt-4 flex justify-center"><CalendarSubscription href={calendarUrl} /></div>
                      </div>
                    ) : (
                      <div className={styles.fixtureSurface}><CalendarPhase matchdays={filterHomeMatchdays(cuadrangularMatchdays, calendarFilter)} phaseLabel="Cuadrangular" subscriptionHref={calendarUrl} phaseKey={`groups-${calendarFilter}`} /></div>
                    )}
                  </>
                ) : fechasPhase === "semifinales" ? (
                  <div className={styles.fixtureSurface}><CalendarPhase matchdays={filterHomeMatchdays(semifinalMatchdays, calendarFilter)} phaseLabel="Semifinales" subscriptionHref={calendarUrl} phaseKey={`semis-${calendarFilter}`} /></div>
                ) : (
                  <div className={styles.fixtureSurface}><CalendarPhase matchdays={filterHomeMatchdays(finalMatchdays, calendarFilter)} phaseLabel="Gran Final" subscriptionHref={calendarUrl} phaseKey={`final-${calendarFilter}`} /></div>
                )}
              </motion.div>
            </TabsContent>

          </Tabs>
        </div>
      </section>

      {children}
    </main>
  );
}
