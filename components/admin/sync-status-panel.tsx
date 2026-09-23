"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AdminCard,
  AdminCardContent,
  AdminCardHeader,
} from "@/components/admin/admin-card";
import { AdminBadge } from "@/components/admin/admin-badge";
import { getApiErrorMessage } from "@/lib/admin/client-errors";
import { latestRunsByScraper } from "@/lib/admin/sync-status";
import type { SyncArea } from "@/lib/admin/sync-areas";
import type { ScraperRun } from "@/lib/types/supabase";

const SCRAPER_LABELS: Record<string, string> = {
  standings: "Tabla de posiciones",
  matches: "Calendario",
  results: "Resultados",
  upcoming: "Próximos partidos",
  scorers: "Goleadoras",
  "stage-standings": "Posiciones de cuadrangulares",
  "cuadrangular-matches": "Partidos de cuadrangulares",
};

export function SyncStatusPanel({ area }: { area: SyncArea }) {
  const [runs, setRuns] = useState<ScraperRun[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = async () => {
    const response = await fetch("/api/admin/scrapers/runs?offset=0&limit=100");
    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, "No se pudo cargar el estado"));
    }
    setRuns(await response.json());
  };

  useEffect(() => {
    let active = true;
    const loadInitialRuns = async () => {
      try {
        const response = await fetch("/api/admin/scrapers/runs?offset=0&limit=100");
        if (!response.ok) {
          throw new Error(await getApiErrorMessage(response, "No se pudo cargar el estado"));
        }
        const nextRuns: ScraperRun[] = await response.json();
        if (active) setRuns(nextRuns);
      } catch (loadError: unknown) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el estado");
        }
      }
    };
    void loadInitialRuns();
    return () => {
      active = false;
    };
  }, []);

  const latestRuns = latestRunsByScraper(runs, area.scraperIds);

  const runScraper = async (scraper: string) => {
    setRunning(scraper);
    setError(null);
    try {
      const response = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scraper }),
      });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "No se pudo ejecutar la sincronización"));
      }
      await loadRuns();
    } catch (runError: unknown) {
      setError(runError instanceof Error ? runError.message : "No se pudo ejecutar la sincronización");
    } finally {
      setRunning(null);
    }
  };

  return (
    <AdminCard className="mb-6">
      <AdminCardHeader
        title={`Sincronización de ${area.label}`}
        description="Aplica los cambios automáticamente cuando no hay riesgos; si detecta algo, lo deja pendiente de revisión."
      />
      <AdminCardContent className="space-y-3">
        <div aria-live="polite" className="space-y-2 text-sm">
          {error && (
            <p className="text-[color:var(--color-danger)]" role="alert">
              {error}
            </p>
          )}
          {area.scraperIds.map((scraper) => {
            const latest = latestRuns[scraper];
            return (
              <div
                key={scraper}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-border)]/25 pb-3 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{SCRAPER_LABELS[scraper] ?? scraper}</p>
                  <p className="font-mono text-xs text-[color:var(--color-foreground)]/60">
                    {latest ? `Última ejecución: ${new Date(latest.started_at).toLocaleString()}` : "Sin ejecuciones registradas"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <AdminBadge status={latest?.status ?? "inactive"} label={latest ? undefined : "Sin datos"} />
                  {latest?.status === "pending_review" && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/scrapers/runs/${latest.id}`}>
                        <Eye size={14} aria-hidden="true" /> Revisar
                      </Link>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runScraper(scraper)}
                    disabled={running !== null}
                    aria-label={`Sincronizar ${SCRAPER_LABELS[scraper] ?? scraper}`}
                  >
                    {running === scraper ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={14} aria-hidden="true" />}
                    {running === scraper ? "Sincronizando..." : "Sincronizar"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </AdminCardContent>
    </AdminCard>
  );
}