import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSelect } from "@/components/admin/admin-select";
import {
  AdminCard,
  AdminCardContent,
  AdminCardHeader,
} from "@/components/admin/admin-card";
import { AdminDataTable } from "@/components/admin/admin-data-table";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  "match.created": "Partido creado",
  "match.updated": "Partido actualizado",
  "match.deleted": "Partido eliminado",
  "match.round_updated": "Jornada actualizada",
  "match.scores_cleared": "Marcadores limpiados",
  "team.created": "Equipo creado",
  "team.updated": "Equipo actualizado",
  "team.deleted": "Equipo eliminado",
  "season.created": "Temporada creada",
  "season.updated": "Temporada actualizada",
  "season.activated": "Temporada activada",
  "season.deleted": "Temporada eliminada",
  "scorer.created": "Goleadora creada",
  "scorer.updated": "Goleadora actualizada",
  "scorer.deleted": "Goleadora eliminada",
  "standings.updated": "Posiciones actualizadas",
  "stage_standings.updated": "Posiciones de fase actualizadas",
  "scraper.applied": "Scraper aplicado",
  "scraper.rejected": "Scraper rechazado",
};

function actionLabel(action: string) { return ACTION_LABELS[action] ?? action; }
function metadataLabel(metadata: unknown) { return metadata && typeof metadata === "object" && Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : ""; }

export default async function AdminActivity({ searchParams }: { searchParams?: Promise<{ entity?: string; action?: string; page?: string }> }) {
  const params = (await searchParams) ?? {};
  const page = Math.max(Number(params.page ?? 1), 1);
  const pageSize = 50;
  const supabase = await createClient();
  let query = supabase
    .from("admin_audit_log")
    .select("id, user_id, action, entity_type, entity_id, metadata, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (params.entity) query = query.eq("entity_type", params.entity);
  if (params.action) query = query.eq("action", params.action);
  const { data: entries, error, count } = await query;
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  const filterQuery = (nextPage: number) => new URLSearchParams({ ...(params.entity ? { entity: params.entity } : {}), ...(params.action ? { action: params.action } : {}), page: String(nextPage) }).toString();

  return (
    <div>
      <AdminPageHeader
        title="Actividad"
        description="Historial reciente de cambios manuales y operaciones administrativas."
      />

      <AdminCard>
        <AdminCardHeader title="Últimas acciones" />
        <AdminCardContent>
          <form className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]" method="get">
            <AdminSelect aria-label="Filtrar por entidad" name="entity" defaultValue={params.entity ?? ""}><option value="">Todas las entidades</option><option value="match">Partidos</option><option value="team">Equipos</option><option value="season">Temporadas</option><option value="scorer">Goleadoras</option><option value="scraper_run">Scrapers</option></AdminSelect>
            <AdminSelect aria-label="Filtrar por acción" name="action" defaultValue={params.action ?? ""}><option value="">Todas las acciones</option>{Object.entries(ACTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</AdminSelect>
            <Button type="submit" className="h-9 rounded-full">Filtrar</Button>
          </form>
          {error ? (
            <p className="text-sm text-[color:var(--color-destructive)]">
              No se pudo cargar la actividad: {error.message}
            </p>
          ) : (entries?.length ?? 0) === 0 ? (
            <p className="font-mono text-sm text-[color:var(--color-foreground)]/65">
              Aún no hay actividad registrada.
            </p>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {entries?.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-[color:var(--color-border)]/35 bg-[color:var(--color-card)]/45 p-3"
                  >
                    <p className="font-mono text-xs text-[color:var(--color-foreground)]/55">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                    <p className="mt-1 font-semibold text-[color:var(--color-foreground)]">
                      {actionLabel(entry.action)}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="font-mono uppercase tracking-wider text-[color:var(--color-foreground)]/55">
                          Entidad
                        </p>
                        <p className="text-[color:var(--color-foreground)]/75">
                          {entry.entity_type}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono uppercase tracking-wider text-[color:var(--color-foreground)]/55">
                          ID
                        </p>
                        <p className="truncate font-mono text-[color:var(--color-foreground)]/75">
                          {entry.entity_id ?? "-"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 truncate font-mono text-xs text-[color:var(--color-foreground)]/55">
                      Usuario: {entry.user_id ?? "-"}
                    </p>
                  </div>
                ))}
              </div>

              <AdminDataTable className="hidden md:block">
                <table aria-label="Historial de actividad administrativa" className="w-full text-sm">
                  <thead className="text-left font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                    <tr className="border-b border-[color:var(--color-border)]/30">
                      <th className="py-2">Fecha</th>
                      <th>Acción</th>
                      <th>Entidad</th>
                      <th>ID</th>
                      <th>Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries?.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-[color:var(--color-border)]/20 text-[color:var(--color-foreground)]/80"
                      >
                        <td className="py-2">
                          {new Date(entry.created_at).toLocaleString()}
                        </td>
                        <td className="font-semibold text-[color:var(--color-foreground)]">
                          {actionLabel(entry.action)}
                        </td>
                        <td>{entry.entity_type}</td>
                        <td className="font-mono text-xs text-[color:var(--color-foreground)]/55">
                          {entry.entity_id ?? "-"}
                        </td>
                        <td className="font-mono text-xs text-[color:var(--color-foreground)]/75">
                          {entry.user_id ?? "-"}
                          {metadataLabel(entry.metadata) && <span className="block max-w-xs truncate" title={metadataLabel(entry.metadata)}>{metadataLabel(entry.metadata)}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminDataTable>
              {pageCount > 1 && <div className="mt-4 flex items-center justify-between gap-3 font-mono text-xs text-[color:var(--color-foreground)]/75"><span>Página {page} de {pageCount}</span><div className="flex gap-2">{page > 1 && <Link className="rounded-full border px-3 py-1.5" href={`/admin/activity?${filterQuery(page - 1)}`}>Anterior</Link>}{page < pageCount && <Link className="rounded-full border px-3 py-1.5" href={`/admin/activity?${filterQuery(page + 1)}`}>Siguiente</Link>}</div></div>}
            </>
          )}
        </AdminCardContent>
      </AdminCard>
    </div>
  );
}
