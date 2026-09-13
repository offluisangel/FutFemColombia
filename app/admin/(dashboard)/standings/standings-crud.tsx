import { Trophy } from "lucide-react";
import { AdminBadge } from "@/components/admin/admin-badge";
import type { Standing } from "@/lib/types/supabase";
import {
  AdminCard,
  AdminCardContent,
  AdminCardHeader,
} from "@/components/admin/admin-card";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Team = { id: string; name: string };

export function StandingsTable({
  standings,
  teams,
}: {
  standings: Standing[];
  teams: Team[];
}) {
  const teamNames = new Map(teams.map((t) => [t.id, t.name]));

  return (
    <AdminCard>
      <AdminCardHeader
        title="Tabla de posiciones"
        description="Solo lectura. Se actualiza desde el módulo de scrapers."
        action={<AdminBadge status="readonly" />}
      />

      <AdminCardContent>
        {standings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[color:var(--color-border)]/50 bg-[color:var(--color-muted)]/25 p-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)]">
              <Trophy size={16} />
            </div>
            <p className="font-serif text-xl font-bold uppercase">
              Sin posiciones
            </p>
            <p className="mt-1 font-mono text-sm text-[color:var(--color-foreground)]/60">
              Ejecuta el scraper de tabla para poblar esta vista.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {standings.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-[color:var(--color-border)]/35 bg-[color:var(--color-card)]/45 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[color:var(--color-foreground)]">
                      {row.pos}. {teamNames.get(row.team_id) ?? "-"}
                    </p>
                    <p className="text-lg font-black text-[color:var(--color-foreground)]">
                      {row.pts} pts
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    {[
                      ["PJ", row.pj],
                      ["PG", row.pg],
                      ["PE", row.pe],
                      ["PP", row.pp],
                      ["GF", row.gf],
                      ["GC", row.gc],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-lg border border-[color:var(--color-border)]/30 px-2 py-1.5"
                      >
                        <p className="font-mono uppercase tracking-wider text-[color:var(--color-foreground)]/55">
                          {label}
                        </p>
                        <p className="mt-0.5 text-[color:var(--color-foreground)]/75">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p
                    className={`mt-3 text-sm font-semibold ${
                      row.dif > 0
                        ? "text-emerald-300"
                        : row.dif < 0
                          ? "text-[color:var(--color-danger)]"
                          : "text-[color:var(--color-foreground)]/70"
                    }`}
                  >
                    DIF: {row.dif > 0 ? `+${row.dif}` : row.dif}
                  </p>
                </div>
              ))}
            </div>

            <AdminDataTable className="hidden md:block">
              <Table>
                <caption className="sr-only">Tabla de posiciones</caption>
                <TableHeader>
                  <TableRow className="border-[color:var(--color-border)]/25 hover:bg-transparent">
                    <TableHead className="w-12 font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                      #
                    </TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                      Equipo
                    </TableHead>
                    <TableHead className="w-16 text-center font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                      PTS
                    </TableHead>
                    <TableHead className="w-12 text-center font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                      PJ
                    </TableHead>
                    <TableHead className="hidden w-12 text-center font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60 md:table-cell">
                      PG
                    </TableHead>
                    <TableHead className="hidden w-12 text-center font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60 md:table-cell">
                      PE
                    </TableHead>
                    <TableHead className="hidden w-12 text-center font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60 md:table-cell">
                      PP
                    </TableHead>
                    <TableHead className="hidden w-12 text-center font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60 lg:table-cell">
                      GF
                    </TableHead>
                    <TableHead className="hidden w-12 text-center font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60 lg:table-cell">
                      GC
                    </TableHead>
                    <TableHead className="w-12 text-center font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                      DIF
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-[color:var(--color-border)]/20 hover:bg-[color:var(--color-primary)]/5"
                    >
                      <TableCell className="text-[color:var(--color-foreground)]/60">
                        {row.pos}
                      </TableCell>
                      <TableCell className="py-3 text-sm font-semibold text-[color:var(--color-foreground)]">
                        {teamNames.get(row.team_id) ?? "-"}
                      </TableCell>
                      <TableCell className="text-center text-lg font-bold text-[color:var(--color-foreground)]">
                        {row.pts}
                      </TableCell>
                      <TableCell className="text-center text-[color:var(--color-foreground)]/75">
                        {row.pj}
                      </TableCell>
                      <TableCell className="hidden text-center text-[color:var(--color-foreground)]/75 md:table-cell">
                        {row.pg}
                      </TableCell>
                      <TableCell className="hidden text-center text-[color:var(--color-foreground)]/75 md:table-cell">
                        {row.pe}
                      </TableCell>
                      <TableCell className="hidden text-center text-[color:var(--color-foreground)]/75 md:table-cell">
                        {row.pp}
                      </TableCell>
                      <TableCell className="hidden text-center text-[color:var(--color-foreground)]/75 lg:table-cell">
                        {row.gf}
                      </TableCell>
                      <TableCell className="hidden text-center text-[color:var(--color-foreground)]/75 lg:table-cell">
                        {row.gc}
                      </TableCell>
                      <TableCell
                        className={`text-center font-semibold ${
                          row.dif > 0
                            ? "text-emerald-300"
                            : row.dif < 0
                              ? "text-[color:var(--color-danger)]"
                              : "text-[color:var(--color-foreground)]/70"
                        }`}
                      >
                        {row.dif > 0 ? `+${row.dif}` : row.dif}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminDataTable>
          </>
        )}
      </AdminCardContent>
    </AdminCard>
  );
}
