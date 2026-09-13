"use client";

import { useState, useEffect } from "react";
import { TeamShield } from "@/components/liga/team-shield";
import { formatMatchDate } from "@/lib/format-date";

interface ResultMatch {
  local: string;
  golesLocal: number;
  visitante: string;
  golesVisitante: number;
  hora: string;
}

interface ResultJornada {
  jornada: number;
  fecha: string;
  partidos: ResultMatch[];
}

export function RecentResults({ mini = false }: { mini?: boolean }) {
  const [results, setResults] = useState<ResultJornada[]>([]);

  useEffect(() => {
    fetch("/api/results")
      .then((r) => r.json())
      .then(setResults);
  }, []);

  if (results.length === 0) {
    if (mini) {
      return (
        <div className="bg-[color:var(--color-card)]/12 border border-[color:var(--color-border)]/20 rounded-2xl p-4">
          <h3 className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-primary)] mb-3">
            Últimos Resultados
          </h3>
          <p className="font-mono text-xs text-[color:var(--color-foreground)]/40 text-center py-4">
            Sin resultados disponibles
          </p>
        </div>
      );
    }
    return null;
  }

  if (mini) {
    const latest = results[0];
    return (
      <div className="bg-[color:var(--color-card)]/12 border border-[color:var(--color-border)]/20 rounded-2xl p-4">
        <h3 className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-primary)] mb-3">
          Últimos Resultados
        </h3>
        <div className="divide-y divide-[color:var(--color-border)]/10">
          {latest.partidos.map((partido, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 gap-1"
            >
              <span className="font-mono text-[13px] truncate flex-1 text-right">
                {partido.local}
              </span>
              <span className="font-mono text-[13px] font-bold shrink-0 px-1.5 text-[color:var(--color-foreground)]">
                {partido.golesLocal}-{partido.golesVisitante}
              </span>
              <span className="font-mono text-[13px] truncate flex-1">
                {partido.visitante}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-[color:var(--color-border)]/10">
          <span className="font-mono text-xs text-[color:var(--color-foreground)]/40">
            Jornada {latest.jornada} - {formatMatchDate(latest.fecha)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((jornada) => (
        <div
          key={jornada.jornada}
          className="bg-[color:var(--color-card)]/12 border border-[color:var(--color-border)]/20 rounded-2xl overflow-hidden"
        >
          <div className="p-4 md:p-6 border-b border-[color:var(--color-border)]/20 flex justify-between items-center">
            <div>
              <span className="font-mono text-[color:var(--color-primary)] text-sm">
                Jornada {jornada.jornada}
              </span>
              <h3 className="font-serif text-xl font-bold mt-1">Resultados</h3>
            </div>
            <span className="font-mono text-[color:var(--color-foreground-muted)] text-sm">
              {formatMatchDate(jornada.fecha)}
            </span>
          </div>

          <div className="divide-y divide-white/10">
            {jornada.partidos.map((partido, i) => {
              const localWon = partido.golesLocal > partido.golesVisitante;
              const visitorWon = partido.golesVisitante > partido.golesLocal;
              const isDraw = partido.golesLocal === partido.golesVisitante;

              return (
                <div
                  key={i}
                  className="p-4 hover:bg-[color:var(--color-card)]/12 transition-colors"
                >
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 md:gap-4 items-center">
                    {partido.hora && (
                      <div className="col-span-3 text-center mb-1">
                        <span className="font-mono text-xs text-[color:var(--color-foreground)]">
                          {partido.hora}
                        </span>
                      </div>
                    )}
                    {/* Equipo Local */}
                    <div className="flex items-center justify-end gap-2 md:gap-3">
                      <span
                        className={`font-mono text-xs md:text-sm text-right ${
                          localWon
                            ? "font-bold text-[color:var(--color-foreground)]"
                            : "text-[color:var(--color-foreground-muted)]"
                        }`}
                      >
                        {partido.local}
                      </span>
                      <TeamShield
                        teamName={partido.local}
                        sizeClassName="h-9 w-9 md:h-11 md:w-11"
                        tone={localWon ? "primary" : "muted"}
                      />
                    </div>

                    {/* Marcador */}
                    <div className="flex items-center justify-center gap-2 md:gap-3 px-2 md:px-4">
                      <span className="font-mono text-xl md:text-2xl font-bold text-[color:var(--color-foreground)]">
                        {partido.golesLocal}
                      </span>
                      <span className="font-mono text-[color:var(--color-foreground)]/40">
                        -
                      </span>
                      <span className="font-mono text-xl md:text-2xl font-bold text-[color:var(--color-foreground)]">
                        {partido.golesVisitante}
                      </span>
                    </div>

                    {/* Equipo Visitante */}
                    <div className="flex items-center gap-2 md:gap-3">
                      <TeamShield
                        teamName={partido.visitante}
                        sizeClassName="h-9 w-9 md:h-11 md:w-11"
                        tone={visitorWon ? "primary" : "muted"}
                      />
                      <span
                        className={`font-mono text-xs md:text-sm ${
                          visitorWon
                            ? "font-bold text-[color:var(--color-foreground)]"
                            : "text-[color:var(--color-foreground-muted)]"
                        }`}
                      >
                        {partido.visitante}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
