"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { StandingsTable, type TeamStanding } from "@/components/liga/standings-table";
import { MatchCalendar, type Matchday } from "@/components/liga/match-calendar";
import { UpcomingMatches, type UpcomingMatch } from "@/components/liga/upcoming-matches";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteHeader, type TeamInfo } from "@/components/liga/site-header";
import { ScorersTable, type Scorer } from "@/components/liga/scorers-table";

import {
  Calendar,
  Trophy,
  Clock,
  Github,
  Instagram,
  Youtube,
  ArrowRight,
} from "lucide-react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

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
}

type FechasPhase = "regular" | "cuadrangular" | "semifinales" | "final";

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
}: HomePageClientProps) {
  const [activeTab, setActiveTab] = useState("clasificacion");
  const hasCuadrangular = cuadrangularMatchdays.length > 0 || cuadrangularUpcoming.length > 0;
  const hasSemifinales = semifinalMatchdays.length > 0;
  const hasGranFinal = finalMatchdays.length > 0;
  const hasExtraFechas = hasCuadrangular || hasSemifinales || hasGranFinal;
  const hasKnockout = knockoutUpcoming.length > 0;
  const isRegularFinished = upcoming.length === 0 && matchdays.length > 0;
  const showFinalBanner = finalStageActive;
  const finalStageHeading =
    finalStageStatus === "final_running"
      ? "Final 2026"
      : finalStageStatus === "semifinals_running"
        ? "Semifinales 2026"
        : "Cuadrangulares 2026";
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

      {/* Hero Section */}
      <section className="pt-28 md:pt-20 pb-4 px-4 md:px-8">
        <div className="container mx-auto">
          <div className="flex flex-col items-center text-center mb-6">
            <span className="font-mono text-[color:var(--color-primary)] uppercase text-sm tracking-widest">
              Temporada 2026
            </span>
            <h1 className="font-serif text-4xl md:text-6xl font-black uppercase leading-none mt-1">
              Liga Femenina de
              <span className="block text-[color:var(--color-primary)]">
                Colombia
              </span>
            </h1>
            <p className="font-mono text-[color:var(--color-foreground-muted)] max-w-2xl text-sm md:text-base mt-3">
              Sigue el fútbol femenino colombiano. Resultados en vivo,
              clasificación actualizada y el calendario completo de la liga.
            </p>
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
            className="w-full max-w-4xl mx-auto"
          >
            <TabsList className="w-full md:w-auto bg-[color:var(--color-card)]/12 border border-[color:var(--color-border)]/20 p-1 rounded-full mb-4 flex flex-wrap justify-center gap-1 md:gap-2">
              <TabsTrigger
                value="clasificacion"
                className="data-[state=active]:bg-[color:var(--color-primary)] data-[state=active]:text-[color:var(--color-primary-foreground)] rounded-full px-3 md:px-6 py-1.5 md:py-2 font-mono text-xs md:text-sm uppercase flex items-center gap-1 md:gap-2"
              >
                <Trophy size={14} className="md:w-4 md:h-4" />
                <span className="hidden sm:inline">Clasificación</span>
                <span className="sm:hidden">Tabla</span>
              </TabsTrigger>
              <TabsTrigger
                value="goleadoras"
                className="data-[state=active]:bg-[color:var(--color-primary)] data-[state=active]:text-[color:var(--color-primary-foreground)] rounded-full px-3 md:px-6 py-2 md:py-2.5 font-mono text-xs md:text-sm uppercase flex items-center gap-1 md:gap-2"
              >
                <Trophy size={14} className="md:w-4 md:h-4" />
                Goleadoras
              </TabsTrigger>

              <TabsTrigger
                value="calendario"
                className="data-[state=active]:bg-[color:var(--color-primary)] data-[state=active]:text-[color:var(--color-primary-foreground)] rounded-full px-3 md:px-6 py-1.5 md:py-2 font-mono text-xs md:text-sm uppercase flex items-center gap-1 md:gap-2"
              >
                <Calendar size={14} className="md:w-4 md:h-4" />
                Fechas
              </TabsTrigger>

              <TabsTrigger
                value="proximos"
                className="data-[state=active]:bg-[color:var(--color-primary)] data-[state=active]:text-[color:var(--color-primary-foreground)] rounded-full px-3 md:px-6 py-1.5 md:py-2 font-mono text-xs md:text-sm uppercase flex items-center gap-1 md:gap-2"
              >
                <Clock size={14} className="md:w-4 md:h-4" />
                Próximos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clasificacion" className="mt-0">
              <motion.div
                key={`tab-${activeTab === "clasificacion"}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <StandingsTable teams={standings} />
              </motion.div>
            </TabsContent>

            <TabsContent value="goleadoras" className="mt-0">
              <motion.div
                key={`tab-${activeTab === "goleadoras"}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <ScorersTable scorers={scorers} />
              </motion.div>
            </TabsContent>

            <TabsContent value="calendario" className="mt-3 sm:mt-4">
              <motion.div
                key={`tab-${activeTab === "calendario"}-${fechasPhase}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="space-y-4"
              >
                {hasExtraFechas && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-1 rounded-full border border-[color:var(--color-border)]/20 bg-[color:var(--color-card)]/12 p-1">
                      <button
                        onClick={() => setFechasPhase("regular")}
                        className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider ${fechasPhase === "regular" ? "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]" : "text-[color:var(--color-foreground)]/60"}`}
                      >
                        Regular
                      </button>
                      {hasCuadrangular && (
                        <button
                          onClick={() => setFechasPhase("cuadrangular")}
                          className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider ${fechasPhase === "cuadrangular" ? "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]" : "text-[color:var(--color-foreground)]/60"}`}
                        >
                          Cuadrangulares
                        </button>
                      )}
                      {hasSemifinales && (
                        <button
                          onClick={() => setFechasPhase("semifinales")}
                          className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider ${fechasPhase === "semifinales" ? "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]" : "text-[color:var(--color-foreground)]/60"}`}
                        >
                          Semifinales
                        </button>
                      )}
                      {hasGranFinal && (
                        <button
                          onClick={() => setFechasPhase("final")}
                          className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider ${fechasPhase === "final" ? "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]" : "text-[color:var(--color-foreground)]/60"}`}
                        >
                          Final
                        </button>
                      )}
                    </div>
                    <a href="/cuadrangulares" className="font-mono text-xs text-[color:var(--color-primary)] hover:underline hidden sm:block">
                      Ver fase final →
                    </a>
                  </div>
                )}
                {fechasPhase === "regular" ? (
                  <>
                    <MatchCalendar matchdays={matchdays} />
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
                      </div>
                    ) : (
                      <MatchCalendar matchdays={cuadrangularMatchdays} phaseLabel="Cuadrangular" />
                    )}
                  </>
                ) : fechasPhase === "semifinales" ? (
                  <MatchCalendar matchdays={semifinalMatchdays} phaseLabel="Semifinales" />
                ) : (
                  <MatchCalendar matchdays={finalMatchdays} phaseLabel="Gran Final" />
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="proximos" className="mt-3 sm:mt-4">
              <motion.div
                key={`tab-${activeTab === "proximos"}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="space-y-6"
              >
                {hasKnockout ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[color:var(--color-primary)] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-primary-foreground)]">{knockoutUpcoming[0]?.phase_label ?? "Eliminatorias"}</span>
                    </div>
                    <UpcomingMatches upcoming={knockoutUpcoming} nextJornada={knockoutUpcoming[0]?.jornada ?? null} />
                  </>
                ) : cuadrangularUpcoming.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[color:var(--color-primary)] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-primary-foreground)]">Cuadrangulares</span>
                    </div>
                    <UpcomingMatches upcoming={cuadrangularUpcoming} nextJornada={cuadrangularUpcoming[0]?.jornada ?? null} />
                  </>
                ) : (
                  <UpcomingMatches upcoming={upcoming} nextJornada={nextJornada} />
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
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

          {/* Centro: enlaces sociales */}
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
