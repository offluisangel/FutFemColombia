import Link from "next/link";
import { CheckCircle2, TriangleAlert, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminCard,
  AdminCardContent,
  AdminCardHeader,
} from "@/components/admin/admin-card";
import { AdminBadge } from "@/components/admin/admin-badge";
import type { SyncRunLite } from "@/lib/admin/sync-status";
import { BASE_SCRAPERS } from "@/lib/admin/scrapers";

export const dynamic = "force-dynamic";

const scraperLabels: Record<string, string> = {
  standings: "Posiciones",
  matches: "Calendario",
  results: "Resultados",
  upcoming: "Próximos partidos",
  scorers: "Goleadoras",
  "stage-standings": "Posiciones de cuadrangulares",
  "cuadrangular-matches": "Partidos de cuadrangulares",
};

export default async function AdminDashboard() {
  const supabase = await createClient();

  const runFields = "id, scraper, status, started_at, created_at";
  const [matchesRes, seasonsRes, pendingRes, ...scraperRunsRes] =
    await Promise.all([
      supabase
        .from("matches")
        .select("status, match_date, match_time, local_score, away_score"),
      supabase.from("seasons").select("id, name, is_active"),
      supabase
        .from("scraper_runs")
        .select(runFields)
        .eq("status", "pending_review")
        .order("created_at", { ascending: false })
        .limit(20),
      ...BASE_SCRAPERS.map((scraper) =>
        supabase
          .from("scraper_runs")
          .select(runFields)
          .eq("scraper", scraper)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ),
    ]);

  const matches = matchesRes.data ?? [];
  const seasons = seasonsRes.data ?? [];
  const pendingRuns = (pendingRes.data ?? []) as SyncRunLite[];
  const latestRuns: Record<string, SyncRunLite | undefined> = {};
  BASE_SCRAPERS.forEach((scraper, index) => {
    const row = scraperRunsRes[index] as { data: SyncRunLite | null };
    latestRuns[scraper] = row.data ?? undefined;
  });
  const activeSeasons = seasons.filter((s) => s.is_active);
  const failedRuns = Object.values(latestRuns).filter(
    (run) => run?.status === "failed",
  ) as SyncRunLite[];
  const matchesWithoutDate = matches.filter(
    (m) => !m.match_date || !m.match_time,
  ).length;
  const playedWithoutScore = matches.filter(
    (m) =>
      m.status === "played" && (m.local_score == null || m.away_score == null),
  ).length;
  const hasDataBlockers =
    activeSeasons.length !== 1 || matchesWithoutDate > 0 || playedWithoutScore > 0;
  const hasDecisions = pendingRuns.length > 0 || failedRuns.length > 0 || hasDataBlockers;

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Decisiones pendientes, fallos de sincronización y bloqueos de calidad de datos."
      />
      {!hasDecisions && (
        <AdminCard className="border-[color:var(--color-success)]/30">
          <AdminCardContent className="flex items-start gap-3">
            <CheckCircle2 size={18} className="mt-0.5 text-[color:var(--color-success)]" aria-hidden="true" />
            <div>
              <p className="font-semibold">No hay decisiones pendientes</p>
              <p className="mt-1 text-sm text-[color:var(--color-foreground)]/65">
                Las sincronizaciones y la calidad de datos no muestran bloqueos activos.
              </p>
            </div>
          </AdminCardContent>
        </AdminCard>
      )}

      <div className="grid gap-4 xl:grid-cols-3" aria-live="polite">
        {pendingRuns.length > 0 && (
          <AdminCard>
            <AdminCardHeader title="Revisiones pendientes" description="Previews que todavía requieren una decisión." />
            <AdminCardContent className="space-y-3">
              {pendingRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between gap-3 border-b border-[color:var(--color-border)]/25 pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{scraperLabels[run.scraper] ?? run.scraper}</p>
                    <p className="font-mono text-xs text-[color:var(--color-foreground)]/60">{new Date(run.started_at).toLocaleString()}</p>
                  </div>
                  <Link href={`/admin/scrapers/runs/${run.id}`} className="shrink-0 font-mono text-xs text-[color:var(--color-primary)] hover:underline">Revisar</Link>
                </div>
              ))}
            </AdminCardContent>
          </AdminCard>
        )}

        {failedRuns.length > 0 && (
          <AdminCard className="border-[color:var(--color-danger)]/30">
            <AdminCardHeader title="Sincronizaciones fallidas" description="Solo se muestran fallos que siguen siendo el último estado del scraper." />
            <AdminCardContent className="space-y-3">
              {failedRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between gap-3 border-b border-[color:var(--color-border)]/25 pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{scraperLabels[run.scraper] ?? run.scraper}</p>
                    <p className="font-mono text-xs text-[color:var(--color-foreground)]/60">{new Date(run.started_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AdminBadge status="failed" />
                    <Link href={`/admin/scrapers/runs/${run.id}`} className="font-mono text-xs text-[color:var(--color-primary)] hover:underline">Ver</Link>
                  </div>
                </div>
              ))}
            </AdminCardContent>
          </AdminCard>
        )}

        {hasDataBlockers && (
          <AdminCard className="border-amber-400/30">
            <AdminCardHeader title="Bloqueos de datos" description="Problemas que requieren corrección antes de publicar." />
            <AdminCardContent className="space-y-3 text-sm">
              {activeSeasons.length !== 1 && (
                <Link href="/admin/seasons" className="flex items-start gap-2 text-amber-300 hover:underline">
                  <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {activeSeasons.length === 0 ? "No hay una temporada activa." : `Hay ${activeSeasons.length} temporadas activas.`}
                </Link>
              )}
              {matchesWithoutDate > 0 && (
                <Link href="/admin/matches" className="flex items-start gap-2 text-amber-300 hover:underline">
                  <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {matchesWithoutDate} partido(s) sin fecha u hora completa.
                </Link>
              )}
              {playedWithoutScore > 0 && (
                <Link href="/admin/matches" className="flex items-start gap-2 text-amber-300 hover:underline">
                  <XCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {playedWithoutScore} partido(s) jugados sin marcador completo.
                </Link>
              )}
            </AdminCardContent>
          </AdminCard>
        )}
      </div>
    </div>
  );
}
