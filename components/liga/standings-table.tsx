"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { TeamShield } from "@/components/liga/team-shield";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface TeamStanding {
  pos: number;
  name: string;
  slug: string;
  shield_url: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
  pts: number;
}

export function StandingsTable({ teams, compact = false }: { teams: TeamStanding[]; compact?: boolean }) {
  if (teams.length === 0) {
    return (
      <div className="bg-[color:var(--color-card)]/12 border border-[color:var(--color-border)]/20 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[color:var(--color-muted)]/20 flex items-center justify-center mx-auto mb-4">
          <Trophy size={20} className="text-[color:var(--color-foreground)]/40" />
        </div>
        <h2 className="font-serif text-xl font-bold uppercase mb-2">
          Tabla de Posiciones
        </h2>
        <p className="font-mono text-sm text-[color:var(--color-foreground)]/60">
          Posiciones aún no definidas
        </p>
      </div>
    );
  }

  const currentMatchday = teams[0]?.pj;

  return (
    <div
      className={`bg-[color:var(--color-card)]/12 border border-[color:var(--color-border)]/20 rounded-2xl overflow-hidden ${compact ? "compact-table-wrapper" : ""}`}
    >
      <div
        className={`border-b border-[color:var(--color-border)]/20 ${compact ? "p-4" : "p-6"}`}
      >
        <h2
          className={`font-serif font-bold uppercase ${compact ? "text-xl" : "text-2xl md:text-3xl"}`}
        >
          Tabla de Posiciones
        </h2>
        <p
          className={`font-mono text-[color:var(--color-foreground-muted)] ${compact ? "text-sm mt-1" : "text-sm mt-2"}`}
        >
          Jornada {currentMatchday}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-[color:var(--color-border)]/20 hover:bg-transparent">
            <TableHead
              className={`text-[color:var(--color-foreground)]/60 font-mono uppercase ${compact ? "text-xs w-8" : "text-xs w-12"}`}
            >
              #
            </TableHead>
            <TableHead
              className={`text-[color:var(--color-foreground)]/60 font-mono uppercase ${compact ? "text-xs" : "text-xs"}`}
            >
              Equipo
            </TableHead>
            <TableHead
              className={`text-[color:var(--color-foreground)]/60 font-mono uppercase text-center ${compact ? "text-xs" : "text-xs"}`}
            >
              PTS
            </TableHead>
            <TableHead
              className={`text-[color:var(--color-foreground)]/60 font-mono uppercase text-center ${compact ? "text-xs" : "text-xs"}`}
            >
              PJ
            </TableHead>
            <TableHead className="text-[color:var(--color-foreground)]/60 font-mono text-xs uppercase text-center hidden md:table-cell">
              PG
            </TableHead>
            <TableHead className="text-[color:var(--color-foreground)]/60 font-mono text-xs uppercase text-center hidden md:table-cell">
              PE
            </TableHead>
            <TableHead className="text-[color:var(--color-foreground)]/60 font-mono text-xs uppercase text-center hidden md:table-cell">
              PP
            </TableHead>
            <TableHead className="text-[color:var(--color-foreground)]/60 font-mono text-xs uppercase text-center hidden lg:table-cell">
              GF
            </TableHead>
            <TableHead className="text-[color:var(--color-foreground)]/60 font-mono text-xs uppercase text-center hidden lg:table-cell">
              GC
            </TableHead>
            <TableHead
              className={`text-[color:var(--color-foreground)]/60 font-mono uppercase text-center ${compact ? "text-xs" : "text-xs"}`}
            >
              DIF
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow
              key={team.pos}
              className={`border-[color:var(--color-border)]/20 hover:bg-[color:var(--color-card)]/12 ${
                team.pos <= 8 ? "bg-[color:var(--color-primary)]/10 border-l-2 border-l-[color:var(--color-primary)]" : team.pos === 9 ? "border-t border-t-[color:var(--color-foreground)]/20" : ""
              }`}
            >
              <TableCell
                className={`font-mono text-center font-medium text-[color:var(--color-foreground)] ${compact ? "text-[13px] w-8 py-2" : "w-12"}`}
              >
                {team.pos}
              </TableCell>
              <TableCell
                className={`font-mono font-medium text-[color:var(--color-foreground)] ${compact ? "text-[13px] py-2" : ""}`}
              >
                <div
                  className={`flex items-center min-w-0 ${compact ? "gap-2.5" : "gap-3"}`}
                >
                  <TeamShield
                    teamName={team.name}
                    shieldUrl={team.shield_url}
                    sizeClassName={compact ? "h-7 w-7" : "h-9 w-9"}
                  />
                  {team.slug ? (
                    <Link
                      href={`/equipos/${team.slug}`}
                      className="truncate hover:text-[color:var(--color-primary)] transition-colors"
                    >
                      {team.name}
                    </Link>
                  ) : (
                    <span className="truncate">{team.name}</span>
                  )}
                </div>
              </TableCell>
              <TableCell
                className={`font-mono text-center font-bold text-[color:var(--color-foreground)] ${compact ? "text-base py-2" : "text-lg"}`}
              >
                {team.pts}
              </TableCell>
              <TableCell
                className={`font-mono text-center text-[color:var(--color-foreground)]/80 ${compact ? "text-[13px] py-2" : ""}`}
              >
                {team.pj}
              </TableCell>
              <TableCell className="font-mono text-center text-[color:var(--color-foreground)]/80 hidden md:table-cell">
                {team.pg}
              </TableCell>
              <TableCell className="font-mono text-center text-[color:var(--color-foreground)]/80 hidden md:table-cell">
                {team.pe}
              </TableCell>
              <TableCell className="font-mono text-center text-[color:var(--color-foreground)]/80 hidden md:table-cell">
                {team.pp}
              </TableCell>
              <TableCell className="font-mono text-center text-[color:var(--color-foreground)]/80 hidden lg:table-cell">
                {team.gf}
              </TableCell>
              <TableCell className="font-mono text-center text-[color:var(--color-foreground)]/80 hidden lg:table-cell">
                {team.gc}
              </TableCell>
              <TableCell
                className={`font-mono text-center font-medium ${compact ? "text-[13px] py-2" : ""} ${
                  team.dif > 0
                    ? "text-[color:var(--color-success)]"
                    : team.dif < 0
                      ? "text-[color:var(--color-danger)]"
                      : "text-[color:var(--color-foreground-muted)]"
                }`}
              >
                {team.dif > 0 ? `+${team.dif}` : team.dif}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="p-4 border-t border-[color:var(--color-border)]/20 flex flex-wrap gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[color:var(--color-primary)]/20 border border-[color:var(--color-primary)]"></span>
          <span className="text-[color:var(--color-foreground)]/60">
            Clasificación a la siguiente fase
          </span>
        </div>
      </div>
    </div>
  );
}
