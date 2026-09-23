"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminBadge } from "@/components/admin/admin-badge";
import {
  AdminCard,
  AdminCardContent,
  AdminCardHeader,
} from "@/components/admin/admin-card";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import type { ScraperRun } from "@/lib/types/supabase";

export default function AdminScrapers() {
  const [runs, setRuns] = useState<ScraperRun[]>([]);
  const [hasMoreRuns, setHasMoreRuns] = useState(true);

  const loadRuns = async (append = false) => {
    const res = await fetch(`/api/admin/scrapers/runs?offset=${append ? runs.length : 0}&limit=50`);
    if (!res.ok) return;
    const nextRuns: ScraperRun[] = await res.json();
    setRuns((current) => append ? [...current, ...nextRuns] : nextRuns);
    setHasMoreRuns(nextRuns.length === 50);
  };

  useEffect(() => {
    let active = true;
    fetch("/api/admin/scrapers/runs?offset=0&limit=50")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active) { setRuns(data); setHasMoreRuns(data.length === 50); }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="Ejecuciones"
        description="Historial de sincronizaciones: aplicadas, pendientes de revisión y fallidas."
      />

      <AdminCard>
        <AdminCardHeader
          title="Últimas ejecuciones"
          description="Resumen de resultados recientes por scraper."
        />
        <AdminCardContent>
          <>
            <div className="space-y-3 md:hidden">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="rounded-xl border border-[color:var(--color-border)]/35 bg-[color:var(--color-card)]/45 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[color:var(--color-foreground)]">
                        {run.scraper}
                      </p>
                      <p className="font-mono text-xs text-[color:var(--color-foreground)]/55">
                        {new Date(run.started_at).toLocaleString()}
                      </p>
                    </div>
                    <AdminBadge status={run.status} />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    {[
                      ["Traídos", run.summary?.fetched ?? 0],
                      ["Creados", run.summary?.creates ?? 0],
                      ["Actualiz.", run.summary?.updates ?? 0],
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

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-[color:var(--color-foreground)]/65">
                      Warnings: {run.summary?.warnings ?? 0}
                    </p>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                    >
                      <Link href={`/admin/scrapers/runs/${run.id}`}>
                        Detalle
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <AdminDataTable className="hidden md:block">
              <table aria-label="Últimas ejecuciones de scrapers" className="w-full text-sm">
                <thead className="text-left font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                  <tr className="border-b border-[color:var(--color-border)]/30">
                    <th className="py-2">Fecha</th>
                    <th>Scraper</th>
                    <th>Fuente</th>
                    <th>Estado</th>
                    <th>Traídos</th>
                    <th>Creados</th>
                    <th>Actualizados</th>
                    <th>Warnings</th>
                    <th className="text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr
                      key={run.id}
                      className="border-b border-[color:var(--color-border)]/20 text-[color:var(--color-foreground)]/80"
                    >
                      <td className="py-2">
                        {new Date(run.started_at).toLocaleString()}
                      </td>
                      <td className="font-semibold text-[color:var(--color-foreground)]">
                        {run.scraper}
                      </td>
                      <td>
                        {run.summary?.source && (
                          <span className="rounded-full border border-[color:var(--color-border)]/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-primary)]">
                            {run.summary.source}
                          </span>
                        )}
                      </td>
                      <td>
                        <AdminBadge status={run.status} />
                        {run.scraper === "scorers" && run.status === "failed" && (
                          <p className="mt-1 max-w-[220px] text-xs text-[color:var(--color-foreground)]/50">
                            Dimayor bloquea la IP de Vercel (403). Se actualiza
                            vía GitHub Actions o desde tu máquina.
                          </p>
                        )}
                      </td>
                      <td>{run.summary?.fetched ?? 0}</td>
                      <td>{run.summary?.creates ?? 0}</td>
                      <td>{run.summary?.updates ?? 0}</td>
                      <td>
                        {(run.summary?.warnings ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-300">
                            <TriangleAlert size={13} />{" "}
                            {run.summary?.warnings ?? 0}
                          </span>
                        ) : (
                          0
                        )}
                      </td>
                      <td className="text-right">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                        >
                          <Link href={`/admin/scrapers/runs/${run.id}`}>
                            Detalle
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminDataTable>
            {hasMoreRuns && <Button variant="outline" className="mt-4 rounded-full" onClick={() => loadRuns(true)}>Cargar más</Button>}
          </>
        </AdminCardContent>
      </AdminCard>
    </div>
  );
}
