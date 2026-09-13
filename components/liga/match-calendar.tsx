"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { TeamShield } from "@/components/liga/team-shield";
import { formatMatchDate } from "@/lib/format-date";

interface Match {
  local: string;
  visitante: string;
  shield_local: string;
  shield_away: string;
  fecha: string;
  hora: string;
  local_score: number | null;
  away_score: number | null;
  group_name?: string | null;
}

export interface Matchday {
  jornada: number;
  fecha: string;
  partidos: Match[];
}

export function MatchCalendar({ matchdays, phaseLabel }: { matchdays: Matchday[]; phaseLabel?: string }) {
  const paginationRef = useRef<HTMLDivElement>(null);
  const [currentMatchday, setCurrentMatchday] = useState(() => {
    const idx = matchdays.findIndex((md) =>
      md.partidos.some((p) => p.local_score === null),
    );
    return idx !== -1 ? idx : matchdays.length - 1;
  });

  if (matchdays.length === 0) {
    return (
      <div className="bg-[color:var(--color-card)]/12 border border-[color:var(--color-border)]/20 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[color:var(--color-muted)]/20 flex items-center justify-center mx-auto mb-4">
          <Calendar size={20} className="text-[color:var(--color-foreground)]/40" />
        </div>
        <h2 className="font-serif text-xl font-bold uppercase mb-2">
          Calendario
        </h2>
        <p className="font-mono text-sm text-[color:var(--color-foreground-muted)]">
          Calendario aún no disponible
        </p>
      </div>
    );
  }

  const matchday = matchdays[currentMatchday];

  return (
    <div className="bg-[color:var(--color-card)]/12 border border-[color:var(--color-border)]/20 rounded-2xl overflow-hidden">
       <div className="p-6 border-b border-[color:var(--color-border)]/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold uppercase">
            {phaseLabel ? phaseLabel : "Calendario"}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentMatchday(Math.max(0, currentMatchday - 1))}
            disabled={currentMatchday === 0}
            aria-label="Jornada anterior"
            className="p-2 bg-[color:var(--color-muted)]/20 text-[color:var(--color-foreground)] rounded-full hover:bg-[color:var(--color-primary)] hover:text-[color:var(--color-primary-foreground)] transition-colors disabled:opacity-30 disabled:hover:bg-[color:var(--color-muted)]/20 disabled:hover:text-[color:var(--color-foreground)]"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <span className="font-mono text-[color:var(--color-primary)] text-sm">
              Jornada {matchday.jornada}
            </span>
            <p className="font-mono text-[color:var(--color-foreground-muted)] text-xs">
              {formatMatchDate(matchday.fecha)}
            </p>
          </div>
          <button
            onClick={() =>
              setCurrentMatchday(
                Math.min(matchdays.length - 1, currentMatchday + 1),
              )
            }
            disabled={currentMatchday === matchdays.length - 1}
            aria-label="Jornada siguiente"
            className="p-2 bg-[color:var(--color-muted)]/20 text-[color:var(--color-foreground)] rounded-full hover:bg-[color:var(--color-primary)] hover:text-[color:var(--color-primary-foreground)] transition-colors disabled:opacity-30 disabled:hover:bg-[color:var(--color-muted)]/20 disabled:hover:text-[color:var(--color-foreground)]"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentMatchday}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="divide-y divide-[color:var(--color-border)]/10"
        >
          {matchday.partidos.map((partido, i) => {
            const played =
              partido.local_score != null && partido.away_score != null;
            const localWon =
              played && partido.local_score! > partido.away_score!;
            const visitorWon =
              played && partido.away_score! > partido.local_score!;

            return (
              <div
                key={i}
                className="p-4 md:p-6 hover:bg-[color:var(--color-card)]/12 transition-colors"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 md:gap-4 items-center">
                  {/* Equipo Local */}
                  <div className="flex items-center justify-end gap-1.5 md:gap-3 min-w-0">
                    <span
                      className={`font-mono font-medium text-xs md:text-base truncate ${
                        played && localWon
                          ? "font-bold text-[color:var(--color-foreground)]"
                          : played
                            ? "text-[color:var(--color-foreground-muted)]"
                            : "text-[color:var(--color-foreground)]"
                      }`}
                    >
                      {partido.local}
                    </span>
                    <TeamShield
                      teamName={partido.local}
                      shieldUrl={partido.shield_local}
                      sizeClassName="h-9 w-9 md:h-11 md:w-11 shrink-0"
                      tone={
                        played && localWon
                          ? "primary"
                          : played
                            ? "muted"
                            : "primary"
                      }
                    />
                  </div>

                  {/* Centro: resultado o fecha/hora */}
                  {played ? (
                    <div className="flex items-center justify-center gap-2 px-1 md:px-4">
                      <span
                        className={`font-mono text-xl md:text-2xl font-bold ${
                          localWon
                            ? "text-[color:var(--color-foreground)]"
                            : "text-[color:var(--color-foreground-muted)]"
                        }`}
                      >
                        {partido.local_score}
                      </span>
                      <span className="font-mono text-[color:var(--color-foreground)]/40">
                        -
                      </span>
                      <span
                        className={`font-mono text-xl md:text-2xl font-bold ${
                          visitorWon
                            ? "text-[color:var(--color-foreground)]"
                            : "text-[color:var(--color-foreground-muted)]"
                        }`}
                      >
                        {partido.away_score}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center px-1 md:px-4 min-w-0">
                      <span className="font-mono text-[10px] md:text-sm text-[color:var(--color-foreground)]/80 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                          {formatMatchDate(partido.fecha, partido.hora)}
                      </span>
                    </div>
                  )}

                  {/* Equipo Visitante */}
                  <div className="flex items-center gap-1.5 md:gap-3 min-w-0">
                    <TeamShield
                      teamName={partido.visitante}
                      shieldUrl={partido.shield_away}
                      sizeClassName="h-9 w-9 md:h-11 md:w-11 shrink-0"
                      tone={
                        played && visitorWon
                          ? "primary"
                          : played
                            ? "muted"
                            : "muted"
                      }
                    />
                    <span
                      className={`font-mono font-medium text-xs md:text-base truncate ${
                        played && visitorWon
                          ? "font-bold text-[color:var(--color-foreground)]"
                          : played
                            ? "text-[color:var(--color-foreground-muted)]"
                            : "text-[color:var(--color-foreground)]"
                      }`}
                    >
                      {partido.visitante}
                    </span>
                  </div>
                </div>
                {partido.group_name && (
                  <div className="mt-2 flex justify-center">
                    <span className="rounded-full border border-[color:var(--color-border)]/25 bg-[color:var(--color-muted)]/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-foreground)]/60">Grupo {partido.group_name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <div className="p-4 border-t border-[color:var(--color-border)]/20">
        <div
          ref={paginationRef}
          className="flex gap-2 overflow-x-auto scrollbar-none justify-center md:justify-center snap-x max-w-full"
        >
          {matchdays.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentMatchday(i)}
              aria-label={`Ir a jornada ${matchdays[i].jornada}`}
              aria-current={i === currentMatchday ? "page" : undefined}
              className={`snap-center shrink-0 w-8 h-8 rounded-full font-mono text-sm transition-colors ${
                i === currentMatchday
                  ? "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]"
                  : "bg-[color:var(--color-muted)]/20 text-[color:var(--color-foreground-muted)] hover:bg-[color:var(--color-card)]/30"
              }`}
            >
              {matchdays[i].jornada}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
