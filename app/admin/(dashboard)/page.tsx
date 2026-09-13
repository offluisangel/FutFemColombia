import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Database,
  Shield,
  TriangleAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminCard,
  AdminCardContent,
  AdminCardHeader,
} from "@/components/admin/admin-card";
import { AdminBadge } from "@/components/admin/admin-badge";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import type { AdminAuditLog, ScraperSummary } from "@/lib/types/supabase";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [teamsRes, matchesRes, seasonsRes, scraperRunsRes, activityRes] = await Promise.all([
    supabase.from("teams").select("id", { count: "exact", head: true }),
    supabase
      .from("matches")
      .select("status, match_date, match_time, local_score, away_score"),
    supabase.from("seasons").select("id, name, is_active", { count: "exact" }),
    supabase
      .from("scraper_runs")
      .select("id, scraper, status, started_at, summary")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("admin_audit_log").select("id, action, entity_type, entity_id, metadata, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const matches = matchesRes.data ?? [];
  const seasons = seasonsRes.data ?? [];
  const scraperRuns = scraperRunsRes.data ?? [];
  const activity = (activityRes.data ?? []) as AdminAuditLog[];
  const played = matches.filter((m) => m.status === "played").length;
  const scheduled = matches.filter((m) => m.status === "scheduled").length;
  const activeSeasons = seasons.filter((s) => s.is_active);
  const pendingScrapers = scraperRuns.filter(
    (run) => run.status === "pending_review",
  );
  const failedScrapers = scraperRuns.filter((run) => run.status === "failed");
  const matchesWithoutDate = matches.filter(
    (m) => !m.match_date || !m.match_time,
  ).length;
  const playedWithoutScore = matches.filter(
    (m) =>
      m.status === "played" && (m.local_score == null || m.away_score == null),
  ).length;

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Estado operativo del panel, calidad de datos y seguimiento de scrapers."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="Equipos"
          value={teamsRes.count ?? 0}
          icon={Shield}
        />
        <AdminStatCard
          title="Partidos"
          value={matches.length}
          icon={CalendarDays}
        />
        <AdminStatCard
          title="Jugados"
          value={played}
          icon={CheckCircle2}
          tone="success"
        />
        <AdminStatCard
          title="Programados"
          value={scheduled}
          icon={Clock}
          tone="warning"
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <AdminCard>
          <AdminCardHeader
            title="Requiere atención"
            description="Alertas operativas para corregir antes de publicar cambios."
          />
          <AdminCardContent className="space-y-3 text-sm">
            {activeSeasons.length !== 1 && (
              <p className="flex items-start gap-2 text-amber-300">
                <TriangleAlert size={16} className="mt-0.5" />
                Hay {activeSeasons.length} temporadas activas. Debe existir
                exactamente una.
              </p>
            )}
            {pendingScrapers.length > 0 && (
              <p className="text-amber-300">
                Hay {pendingScrapers.length} preview(s) de scraper pendientes de
                revisión.
              </p>
            )}
            {failedScrapers.length > 0 && (
              <p className="text-[color:var(--color-destructive)]">
                Hay {failedScrapers.length} scraper(s) fallidos recientemente.
              </p>
            )}
            {matchesWithoutDate > 0 && (
              <p className="text-[color:var(--color-foreground)]/75">
                {matchesWithoutDate} partido(s) sin fecha u hora completa.
              </p>
            )}
            {playedWithoutScore > 0 && (
              <p className="text-[color:var(--color-foreground)]/75">
                {playedWithoutScore} partido(s) jugados sin marcador completo.
              </p>
            )}
            {activeSeasons.length === 1 &&
              pendingScrapers.length === 0 &&
              failedScrapers.length === 0 &&
              matchesWithoutDate === 0 &&
              playedWithoutScore === 0 && (
                <p className="text-[color:var(--color-success)]">Todo se ve bien por ahora.</p>
              )}
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader
            title="Scrapers recientes"
            description="Últimas ejecuciones para seguimiento rápido."
            action={
              <Button asChild size="sm" className="rounded-full">
                <Link href="/admin/scrapers">Ver scrapers</Link>
              </Button>
            }
          />
          <AdminCardContent className="space-y-3">
            {scraperRuns.length === 0 ? (
              <p className="font-mono text-sm text-[color:var(--color-foreground)]/60">
                Aún no hay ejecuciones registradas.
              </p>
            ) : (
              scraperRuns.map((run) => {
                const summary = (run.summary ?? {}) as ScraperSummary;
                return (
                <div
                  key={run.id}
                  className="flex items-center justify-between gap-3 border-b border-[color:var(--color-border)]/25 pb-2 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[color:var(--color-foreground)] truncate">
                        {run.scraper}
                      </p>
                      {summary?.source && (
                        <span className="shrink-0 rounded-full border border-[color:var(--color-border)]/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-primary)]">
                          {summary.source}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-[color:var(--color-foreground)]/55">
                      {new Date(run.started_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <AdminBadge status={run.status} />
                    <Link
                      href={`/admin/scrapers/runs/${run.id}`}
                      className="font-mono text-xs text-[color:var(--color-primary)] hover:underline"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
                );
              })
            )}
          </AdminCardContent>
        </AdminCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <AdminCard>
          <AdminCardHeader title="Acciones rápidas" description="Atajos para las tareas más frecuentes." />
          <AdminCardContent className="flex flex-wrap gap-2">
            <Button asChild className="rounded-full"><Link href="/admin/scrapers">Actualizar datos</Link></Button>
            <Button asChild variant="outline" className="rounded-full"><Link href="/admin/matches">Gestionar partidos</Link></Button>
          </AdminCardContent>
        </AdminCard>
        <AdminCard>
          <AdminCardHeader title="Actividad reciente" action={<Link className="font-mono text-xs text-[color:var(--color-primary)]" href="/admin/activity">Ver todo</Link>} />
          <AdminCardContent className="space-y-2">{activity.length === 0 ? <p className="font-mono text-sm text-[color:var(--color-foreground)]/75">Sin actividad reciente.</p> : activity.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 border-b border-[color:var(--color-border)]/20 pb-2 text-sm last:border-0"><span className="font-semibold">{entry.action}</span><span className="font-mono text-xs text-[color:var(--color-foreground)]/75">{new Date(entry.created_at).toLocaleString()}</span></div>)}</AdminCardContent>
        </AdminCard>
      </div>
      <div className="mt-4 rounded-2xl border border-[color:var(--color-border)]/35 bg-[color:var(--color-card)]/65 p-4">
        <div className="flex items-center gap-2 text-[color:var(--color-foreground)]/75">
          <Database size={16} className="text-[color:var(--color-primary)]" />
          <p className="font-mono text-xs uppercase tracking-wider">
            Temporadas activas: {activeSeasons.length}
          </p>
        </div>
      </div>
    </div>
  );
}
