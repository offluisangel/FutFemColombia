"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Check,
  Eye,
  History,
  Loader2,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminBadge } from "@/components/admin/admin-badge";
import {
  AdminCard,
  AdminCardContent,
  AdminCardHeader,
} from "@/components/admin/admin-card";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getApiErrorMessage } from "@/lib/admin/client-errors";
import type { ScraperRun } from "@/lib/types/supabase";

const SCRAPERS = [
  {
    id: "standings",
    label: "Tabla de posiciones",
    description: "Intenta HTML de Win Sports, cae a API si falla. Actualiza equipos y tabla oficial.",
    source: "HTML → API",
  },
  {
    id: "matches",
    label: "Partidos",
    description: "Intenta HTML de Win Sports, cae a API si falla. Sincroniza calendario completo.",
    source: "HTML → API",
  },
  {
    id: "results",
    label: "Resultados",
    description: "Intenta HTML de Win Sports, cae a API si falla. Detecta marcadores y partidos jugados.",
    source: "HTML → API",
  },
  {
    id: "upcoming",
    label: "Próximos",
    description: "Intenta HTML de Win Sports, cae a API si falla. Actualiza próximos encuentros.",
    source: "HTML → API",
  },
  {
    id: "scorers",
    label: "Goleadoras",
    description: "Consulta la tabla de goleadoras publicada por Dimayor.",
    source: "Dimayor",
  },
];


export default function AdminScrapers() {
  const [running, setRunning] = useState<string | null>(null);
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

  const latestByScraper = useMemo(() => {
    const map = new Map<string, ScraperRun>();
    for (const run of runs) {
      if (!map.has(run.scraper)) map.set(run.scraper, run);
    }
    return map;
  }, [runs]);

  const pendingRuns = runs.filter((run) => run.status === "pending_review");

  const runScraper = async (id: string) => {
    setRunning(id);
    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scraper: id }),
      });

      if (!res.ok) {
        toast.error(await getApiErrorMessage(res, "Error al ejecutar scraper"));
        return;
      }

      const data = await res.json();
      toast.success(data.message ?? "Preview listo");
      await loadRuns();
    } catch {
      toast.error("Error al ejecutar scraper");
    } finally {
      setRunning(null);
    }
  };

  const runAllScrapers = async () => {
    setRunning("all");
    try {
      const res = await fetch("/api/admin/scrape-all", { method: "POST" });

      if (!res.ok) {
        toast.error(await getApiErrorMessage(res, "Error al ejecutar scrapers"));
        return;
      }

      const data = await res.json();
      const ok = data.results?.filter((r: { status: string }) => r.status !== "failed").length ?? 0;
      const failed = data.results?.filter((r: { status: string }) => r.status === "failed").length ?? 0;
      toast.success(`${ok} scrapers listos, ${failed} fallidos`);
      await loadRuns();
    } catch {
      toast.error("Error al ejecutar todos los scrapers");
    } finally {
      setRunning(null);
    }
  };

  const applyRun = async (id: string) => {
    const res = await fetch(`/api/admin/scrapers/runs/${id}/apply`, {
      method: "POST",
    });
    if (!res.ok) {
      toast.error(await getApiErrorMessage(res, "No se pudo aplicar"));
      return;
    }
    toast.success("Cambios aplicados");
    await loadRuns();
  };

  return (
    <div>
      <AdminPageHeader
        title="Scrapers"
        description="Ejecuta scrapers en modo preview, revisa cambios y decide si aplicarlos o rechazarlos."
      />

      <AdminCard className="mb-4 border-[color:var(--color-primary)]/25 bg-[color:var(--color-primary)]/8">
        <AdminCardContent className="flex items-start gap-2 py-4 text-sm text-[color:var(--color-foreground)]/75">
          <Sparkles
            size={16}
            className="mt-0.5 text-[color:var(--color-primary)]"
          />
          <p>
            Esta sección consulta datos desde Win Sports. Primero se genera un
            preview para revisión, luego tú decides aplicar o rechazar cambios.
          </p>
        </AdminCardContent>
      </AdminCard>

      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          onClick={runAllScrapers}
          disabled={running !== null}
          className="rounded-full"
        >
          {running === "all" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          {running === "all" ? "Actualizando todo..." : "Actualizar todo"}
        </Button>
        <Button
          onClick={() => runScraper("upcoming")}
          disabled={running !== null}
          variant="outline"
          className="rounded-full"
        >
          <Bot size={14} />
          {running === "upcoming"
            ? "Obteniendo próxima fecha..."
            : "Próxima fecha"}
        </Button>
      </div>

      {pendingRuns.length > 0 && (
        <AdminCard className="mb-6 border-amber-500/30 bg-amber-500/10">
          <AdminCardHeader
            title="Ejecuciones pendientes"
            description="Previews listos para revisar antes de aplicar."
          />
          <AdminCardContent className="space-y-2 text-sm">
            {pendingRuns.map((run) => (
              <div
                key={run.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2"
              >
                <span className="text-amber-300">
                  {run.scraper} - {new Date(run.started_at).toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => applyRun(run.id)}
                  >
                    <Check size={14} /> Aplicar
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                  >
                    <Link href={`/admin/scrapers/runs/${run.id}`}>
                      <Eye size={14} /> Revisar
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </AdminCardContent>
        </AdminCard>
      )}

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SCRAPERS.map((s) => {
          const latest = latestByScraper.get(s.id);
return (
            <AdminCard key={s.id}>
              <AdminCardHeader title={s.label} description={s.description} />
              <AdminCardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[color:var(--color-border)]/40 bg-[color:var(--color-card)]/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-primary)]">
                    {s.source}
                  </span>
                </div>
                <div className="text-sm text-[color:var(--color-foreground)]/70">
                  <p>
                    Última ejecución:{" "}
                    {latest
                      ? new Date(latest.started_at).toLocaleString()
                      : "Nunca"}
                  </p>
                  {latest && (
                    <AdminBadge status={latest.status} className="mt-2" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => runScraper(s.id)}
                    disabled={running === s.id}
                    className="rounded-full"
                  >
                    <Bot size={14} />
                    {running === s.id ? "Previsualizando..." : "Previsualizar"}
                  </Button>
                  {latest && (
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href={`/admin/scrapers/runs/${latest.id}`}>
                        <History size={14} /> Ver último
                      </Link>
                    </Button>
                  )}
                </div>
              </AdminCardContent>
            </AdminCard>
          );
        })}
      </div>

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
