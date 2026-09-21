"use client";

import { Calendar as CalendarIcon, ExternalLink } from "lucide-react";
import { TeamShield } from "@/components/liga/team-shield";
import { formatMatchDate } from "@/lib/format-date";

export interface UpcomingMatch {
  local: string;
  visitante: string;
  shield_local: string;
  shield_away: string;
  fecha: string;
  hora: string;
  jornada: number;
  group_name?: string | null;
  phase_label?: string | null;
}

export function UpcomingMatches({
  upcoming,
  nextJornada,
  mini = false,
  seasonYear = new Date().getFullYear(),
}: {
  upcoming: UpcomingMatch[];
  nextJornada: number | null;
  mini?: boolean;
  seasonYear?: number;
}) {
  const nextMatches = upcoming.filter((m) => m.jornada === nextJornada);
  const displayJornada = !mini ? nextJornada : upcoming[0]?.jornada;

  const chipText = (m: UpcomingMatch) =>
    m.phase_label ?? (m.group_name ? `Grupo ${m.group_name} · Jornada ${m.jornada}` : null);

  const whenText = (m: UpcomingMatch) => {
    const base = formatMatchDate(m.fecha, m.hora);
    if (base !== "Por definir") return base;
    if (m.phase_label) return `${m.phase_label} — Por definir`;
    if (m.group_name) return `Grupo ${m.group_name} — Por definir`;
    return base;
  };

  if (upcoming.length === 0) {
    if (mini) {
      return (
        <div className="bg-[color:var(--color-card)]/12 border border-[color:var(--color-border)]/20 rounded-2xl p-4">
          <h3 className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-primary)] mb-3">
            Próximos
          </h3>
          <p className="font-mono text-xs text-[color:var(--color-foreground)]/40 text-center py-4">
            Próximos partidos aún por confirmar
          </p>
        </div>
      );
    }
    return (
      <div className="bg-[color:var(--color-card)]/12 border border-[color:var(--color-border)]/20 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[color:var(--color-muted)]/20 flex items-center justify-center mx-auto mb-4">
          <CalendarIcon
            size={20}
            className="text-[color:var(--color-foreground)]/40"
          />
        </div>
        <h2 className="font-serif text-xl font-bold uppercase mb-2">
          Próximos Partidos
        </h2>
        <p className="font-mono text-sm text-[color:var(--color-foreground-muted)]">
          Próximos partidos aún por confirmar
        </p>
      </div>
    );
  }

  if (mini) {
    return (
      <div className="bg-[color:var(--color-card)]/12 border border-[color:var(--color-border)]/20 rounded-2xl p-4">
        <h3 className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-primary)] mb-3">
          Próximos
        </h3>
        <div className="divide-y divide-[color:var(--color-border)]/10">
          {upcoming.slice(0, 5).map((match, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <TeamShield
                  teamName={match.local}
                  shieldUrl={match.shield_local}
                  sizeClassName="h-8 w-8 shrink-0"
                />
                <span className="font-mono text-[13px] truncate">
                  {match.local}
                </span>
              </div>
              <div className="flex flex-col items-center mx-2 shrink-0">
                <span className="font-serif text-xs text-[color:var(--color-foreground)]/30 font-bold">
                  VS
                </span>
              </div>
              <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                <span className="font-mono text-[13px] truncate">
                  {match.visitante}
                </span>
                <TeamShield
                  teamName={match.visitante}
                  shieldUrl={match.shield_away}
                  sizeClassName="h-8 w-8 shrink-0"
                  tone="muted"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-[color:var(--color-border)]/10">
          <span className="font-mono text-xs text-[color:var(--color-foreground)]/40">
            {upcoming[0]?.fecha &&
              `Desde el ${formatMatchDate(upcoming[0].fecha)}`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[color:var(--color-card)]/12 border border-[color:var(--color-border)]/20 rounded-2xl p-6">
        <h2 className="font-serif text-2xl md:text-3xl font-bold uppercase mb-2">
          Próximos Partidos
        </h2>
        {displayJornada && (
          <p className="font-mono text-[color:var(--color-foreground-muted)] text-sm">
            Jornada {displayJornada}
          </p>
        )}
      </div>

      {/* Mobile: lista simplificada (sin waterfall) */}
      <div className="bg-[color:var(--color-card)]/12 border border-[color:var(--color-border)]/20 rounded-2xl overflow-hidden divide-y divide-[color:var(--color-border)]/10 md:hidden">
        {nextMatches.map((match, i) => (
          <div key={i} className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <TeamShield
                teamName={match.local}
                shieldUrl={match.shield_local}
                sizeClassName="h-9 w-9 shrink-0"
              />
              <span className="font-mono text-[13px] font-medium text-[color:var(--color-foreground)] flex-1 truncate">
                {match.local}
              </span>
              <span className="font-serif text-xs text-[color:var(--color-foreground)]/30 font-bold">
                VS
              </span>
              <span className="font-mono text-[13px] font-medium text-[color:var(--color-foreground)] flex-1 truncate text-right">
                {match.visitante}
              </span>
              <TeamShield
                teamName={match.visitante}
                shieldUrl={match.shield_away}
                sizeClassName="h-9 w-9 shrink-0"
                tone="muted"
              />
            </div>
            {chipText(match) && <div className="mt-1 text-center"><span className="rounded-full bg-[color:var(--color-muted)]/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-foreground)]/55">{chipText(match)}</span></div>}
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono text-[11px] text-[color:var(--color-foreground-muted)]">
                {whenText(match)}
              </span>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(match.local)}+vs+${encodeURIComponent(match.visitante)}+Liga+Femenina+${seasonYear}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-border)]/20 bg-[color:var(--color-muted)]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-foreground-muted)] hover:bg-[color:var(--color-primary)] hover:text-[color:var(--color-primary-foreground)] transition-colors shrink-0"
              >
                <ExternalLink size={10} />
                Ver
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: cards con shields grandes */}
      <div className="hidden md:grid md:grid-cols-2 gap-4">
        {nextMatches.map((match, i) => (
          <div
            key={i}
            className="bg-[color:var(--color-card)]/12 border border-[color:var(--color-border)]/20 rounded-2xl"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col items-center text-center flex-1">
                  <TeamShield
                    teamName={match.local}
                    shieldUrl={match.shield_local}
                    sizeClassName="h-[5.5rem] w-[5.5rem] mb-3"
                  />
                  <span className="font-mono text-sm font-medium text-[color:var(--color-foreground)]">
                    {match.local}
                  </span>
                  <span className="font-mono text-xs text-[color:var(--color-foreground)]/40 uppercase mt-1">
                    Local
                  </span>
                </div>

                <div className="flex flex-col items-center px-4">
                  <span className="font-serif text-3xl font-bold text-[color:var(--color-foreground)]/20">
                    VS
                  </span>
                </div>

                <div className="flex flex-col items-center text-center flex-1">
                  <TeamShield
                    teamName={match.visitante}
                    shieldUrl={match.shield_away}
                    sizeClassName="h-[5.5rem] w-[5.5rem] mb-3"
                    tone="muted"
                  />
                  <span className="font-mono text-sm font-medium text-[color:var(--color-foreground)]">
                    {match.visitante}
                  </span>
                  <span className="font-mono text-xs text-[color:var(--color-foreground)]/40 uppercase mt-1">
                    Visitante
                  </span>
                </div>
              </div>

              {chipText(match) && <div className="mb-3 text-center"><span className="rounded-full border border-[color:var(--color-border)]/25 bg-[color:var(--color-muted)]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-foreground)]/60">{chipText(match)}</span></div>}
              <div className="border-t border-[color:var(--color-border)]/20 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[color:var(--color-primary)]/10 flex items-center justify-center shrink-0">
                      <CalendarIcon
                        size={14}
                        className="text-[color:var(--color-foreground-muted)]"
                      />
                    </div>
                    <span className="font-mono text-sm text-[color:var(--color-foreground)]/80">
                      {whenText(match)}
                    </span>
                  </div>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(match.local)}+vs+${encodeURIComponent(match.visitante)}+Liga+Femenina+${seasonYear}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border)]/20 bg-[color:var(--color-muted)]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-foreground-muted)] hover:bg-[color:var(--color-primary)] hover:text-[color:var(--color-primary-foreground)] transition-colors shrink-0"
                  >
                    <ExternalLink size={12} />
                    Ver el partido
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
