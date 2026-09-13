"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { AdminBadge } from "@/components/admin/admin-badge";
import {
  AdminCard,
  AdminCardContent,
  AdminCardHeader,
} from "@/components/admin/admin-card";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSelect } from "@/components/admin/admin-select";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { getApiErrorMessage } from "@/lib/admin/client-errors";
import type { Match, Season, Team } from "@/lib/types/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


export function MatchesTable({
  matches: initial,
  teams,
  seasons,
  initialPhase = "",
}: {
  matches: Match[];
  teams: Team[];
  seasons: Season[];
  initialPhase?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ season: "", jornada: "", phase: initialPhase, status: "", query: "" });
  const [bulkJornada, setBulkJornada] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const pageSize = 12;
  const isKnockout = ["cuadrangular", "semifinal", "final"].includes(initialPhase);
  const [form, setForm] = useState({
    season_id: "",
    jornada: "",
    phase: initialPhase || "regular",
    group_name: "",
    leg: "",
    tie_key: "",
    local_team_id: "",
    away_team_id: "",
    local_score: "",
    away_score: "",
    match_date: "",
    match_time: "",
    status: "scheduled",
  });

  const resetForm = () => {
    setForm({
      season_id: seasons.find((s) => s.is_active)?.id ?? "",
      jornada: "",
      phase: initialPhase || "regular",
      group_name: "",
      leg: "",
      tie_key: "",
      local_team_id: "",
      away_team_id: "",
      local_score: "",
      away_score: "",
      match_date: "",
      match_time: "",
      status: "scheduled",
    });
    setEditing(null);
  };

  const handleEdit = (m: Match) => {
    setEditing(m);
    setForm({
      season_id: m.season_id,
      jornada: String(m.jornada),
      phase: m.phase,
      group_name: m.group_name ?? "",
      leg: m.leg?.toString() ?? "",
      tie_key: m.tie_key ?? "",
      local_team_id: m.local_team_id,
      away_team_id: m.away_team_id,
      local_score: m.local_score?.toString() ?? "",
      away_score: m.away_score?.toString() ?? "",
      match_date: m.match_date ?? "",
      match_time: m.match_time ?? "",
      status: m.status,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      season_id: form.season_id,
      jornada: form.jornada,
      phase: form.phase,
      group_name: form.group_name,
      leg: form.leg,
      tie_key: form.tie_key,
      local_team_id: form.local_team_id,
      away_team_id: form.away_team_id,
      local_score: form.local_score,
      away_score: form.away_score,
      match_date: form.match_date,
      match_time: form.match_time,
      status: form.status,
    };

    const url = editing
      ? `/api/admin/matches?id=${editing.id}`
      : "/api/admin/matches";
    const method = editing ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        toast.error(await getApiErrorMessage(res, "Error al guardar partido"));
        return;
      }

      toast.success(editing ? "Partido actualizado" : "Partido creado");
      setOpen(false);
      resetForm();
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (match: Match) => {
    const res = await fetch(`/api/admin/matches?id=${match.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const message = await getApiErrorMessage(
        res,
        "Error al eliminar partido",
      );
      toast.error(message);
      throw new Error(message);
    }

    toast.success("Partido eliminado");
    router.refresh();
  };

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);
  const filteredMatches = useMemo(() => initial.filter((match) => {
    const names = `${teamMap.get(match.local_team_id) ?? ""} ${teamMap.get(match.away_team_id) ?? ""}`.toLowerCase();
    return (!filters.season || match.season_id === filters.season)
      && (!filters.jornada || String(match.jornada) === filters.jornada)
      && (!filters.phase || match.phase === filters.phase)
      && (!filters.status || match.status === filters.status)
      && (!filters.query || names.includes(filters.query.toLowerCase()));
  }), [filters, initial, teamMap]);
  const pageCount = Math.max(1, Math.ceil(filteredMatches.length / pageSize));
  const visibleMatches = filteredMatches.slice((page - 1) * pageSize, page * pageSize);
  const updateFilter = (key: keyof typeof filters, value: string) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const updateRound = async (clearScores: boolean) => {
    if (!filters.season || !bulkJornada) { toast.error("Selecciona temporada y jornada"); return; }
    setBulkSaving(true);
    try {
      const res = await fetch("/api/admin/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulk: true,
          season_id: filters.season,
          jornada: bulkJornada,
          phase: filters.phase || "regular",

          status: clearScores ? "scheduled" : "played",
          clear_scores: clearScores,
        }),
      });
      if (!res.ok) { toast.error(await getApiErrorMessage(res, "No se pudo actualizar el alcance")); return; }
      const data = await res.json();
      toast.success(`${data.updated} partidos actualizados`);
      router.refresh();
    } finally { setBulkSaving(false); }
  };

  return (
    <AdminCard>
      <AdminCardHeader
        title="Listado de partidos"
        description="Controla fecha, estado, fase y marcador de cada encuentro."
        action={
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="rounded-full" onClick={() => resetForm()}>
                <Plus size={14} /> Nuevo partido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-[color:var(--color-border)]/40 bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl font-bold uppercase">
                  {editing ? "Editar" : "Nuevo"} partido
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminFormField label="Jornada">
                    <Input
                      type="number"
                      value={form.jornada}
                      onChange={(e) =>
                        setForm({ ...form, jornada: e.target.value })
                      }
                    />
                  </AdminFormField>
                  <AdminFormField label="Fase">
                    <AdminSelect
                      value={form.phase}
                      onChange={(e) =>
                        setForm({ ...form, phase: e.target.value })
                      }
                    >
                      <option value="regular">Regular</option>
                      <option value="cuadrangular">Cuadrangular</option>
                      <option value="semifinal">Semifinal</option>
                      <option value="final">Final</option>
                    </AdminSelect>
                  </AdminFormField>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <AdminFormField label="Grupo">
                    <AdminSelect value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })}>
                      <option value="">Sin grupo</option>
                      <option value="A">Grupo A</option>
                      <option value="B">Grupo B</option>
                    </AdminSelect>
                  </AdminFormField>
                  <AdminFormField label="Vuelta" help="1 o 2 para series a ida y vuelta.">
                    <Input type="number" value={form.leg} onChange={(e) => setForm({ ...form, leg: e.target.value })} />
                  </AdminFormField>
                  <AdminFormField label="Clave de serie">
                    <Input value={form.tie_key} onChange={(e) => setForm({ ...form, tie_key: e.target.value })} placeholder="semifinal-1" />
                  </AdminFormField>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminFormField label="Equipo local">
                    <AdminSelect
                      value={form.local_team_id}
                      onChange={(e) =>
                        setForm({ ...form, local_team_id: e.target.value })
                      }
                    >
                      <option value="">Seleccionar</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminFormField>
                  <AdminFormField label="Equipo visitante">
                    <AdminSelect
                      value={form.away_team_id}
                      onChange={(e) =>
                        setForm({ ...form, away_team_id: e.target.value })
                      }
                    >
                      <option value="">Seleccionar</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminFormField>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <AdminFormField label="Goles local">
                    <Input
                      type="number"
                      value={form.local_score}
                      onChange={(e) =>
                        setForm({ ...form, local_score: e.target.value })
                      }
                    />
                  </AdminFormField>
                  <AdminFormField label="Goles visitante">
                    <Input
                      type="number"
                      value={form.away_score}
                      onChange={(e) =>
                        setForm({ ...form, away_score: e.target.value })
                      }
                    />
                  </AdminFormField>
                  <AdminFormField label="Estado">
                    <AdminSelect
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      <option value="scheduled">Programado</option>
                      <option value="played">Jugado</option>
                    </AdminSelect>
                  </AdminFormField>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminFormField label="Fecha">
                    <Input
                      type="date"
                      value={form.match_date}
                      onChange={(e) =>
                        setForm({ ...form, match_date: e.target.value })
                      }
                    />
                  </AdminFormField>
                  <AdminFormField label="Hora">
                    <Input
                      type="time"
                      value={form.match_time}
                      onChange={(e) =>
                        setForm({ ...form, match_time: e.target.value })
                      }
                    />
                  </AdminFormField>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setOpen(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="rounded-full"
                    disabled={saving}
                  >
                    {saving
                      ? "Guardando..."
                      : editing
                        ? "Guardar cambios"
                        : "Crear partido"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <AdminCardContent>
        <div className="mb-5 grid gap-3 md:grid-cols-5">
          <AdminSearchInput placeholder="Buscar equipo" value={filters.query} onChange={(value) => updateFilter("query", value)} />
          <AdminSelect aria-label="Filtrar por temporada" value={filters.season} onChange={(e) => updateFilter("season", e.target.value)}><option value="">Todas las temporadas</option>{seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}</AdminSelect>
          <AdminSelect aria-label="Filtrar por jornada" value={filters.jornada} onChange={(e) => updateFilter("jornada", e.target.value)}><option value="">Todas las jornadas</option>{Array.from(new Set(initial.map((match) => match.jornada))).filter((jornada): jornada is number => jornada != null).sort((a, b) => a - b).map((jornada) => <option key={jornada} value={jornada}>{jornada}</option>)}</AdminSelect>
          <AdminSelect aria-label="Filtrar por fase" value={filters.phase} onChange={(e) => updateFilter("phase", e.target.value)}><option value="">Todas las fases</option>{Array.from(new Set(initial.map((match) => match.phase))).map((phase) => <option key={phase} value={phase}>{phase}</option>)}</AdminSelect>
          <AdminSelect aria-label="Filtrar por estado" value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}><option value="">Todos los estados</option><option value="scheduled">Programados</option><option value="played">Jugados</option></AdminSelect>
        </div>
        {!isKnockout && (
          <div className="mb-5 flex flex-wrap items-end gap-2 rounded-xl border border-[color:var(--color-border)]/30 bg-[color:var(--color-muted)]/20 p-3">
            <div className="min-w-40 flex-1"><label htmlFor="bulk-jornada" className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-[color:var(--color-foreground)]/75">Jornada</label><Input id="bulk-jornada" type="number" min="1" placeholder="Ej. 5" value={bulkJornada} onChange={(e) => setBulkJornada(e.target.value)} /></div>
            <ConfirmActionDialog
              title="Marcar jornada como jugada"
              description={`Se actualizarán los partidos de la jornada ${bulkJornada || "seleccionada"} en la fase ${filters.phase || "regular"}. Todos deben tener marcador completo.`}
              confirmLabel="Marcar jugados"
              confirmAction={() => updateRound(false)}
            >
              <Button variant="outline" className="rounded-full" disabled={bulkSaving || !bulkJornada}>Marcar jugados</Button>
            </ConfirmActionDialog>
            <ConfirmActionDialog
              title="Limpiar marcadores"
              description={`Se borrarán los marcadores de la jornada ${bulkJornada || "seleccionada"} y volverá a estado programado.`}
              confirmLabel="Limpiar marcadores"
              confirmAction={() => updateRound(true)}
            >
              <Button variant="outline" className="rounded-full" disabled={bulkSaving || !bulkJornada}>Limpiar marcadores</Button>
            </ConfirmActionDialog>
            <p className="w-full font-mono text-[11px] text-[color:var(--color-foreground)]/60">La acción se limita a la temporada, fase y jornada indicadas.</p>
          </div>
        )}
        {initial.length === 0 ? (
          <AdminEmptyState icon={<CalendarPlus size={16} />} title="Sin partidos" description="Agrega el primer partido para iniciar el calendario." />
        ) : filteredMatches.length === 0 ? (
          <AdminEmptyState title="Sin resultados" description="Prueba con otros filtros o limpia la búsqueda." />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {visibleMatches.map((m) => {
                const local = teamMap.get(m.local_team_id) ?? "-";
                const away = teamMap.get(m.away_team_id) ?? "-";

                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-[color:var(--color-border)]/35 bg-[color:var(--color-card)]/45 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[color:var(--color-foreground)]">
                          {local}
                        </p>
                        <p className="font-mono text-xs text-[color:var(--color-foreground)]/65">
                          vs {away} · {m.phase}{m.group_name ? ` · Grupo ${m.group_name}` : ""}
                        </p>
                      </div>
                      <AdminBadge status={m.status} />
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-lg border border-[color:var(--color-border)]/30 px-2 py-1.5">
                        <p className="font-mono uppercase tracking-wider text-[color:var(--color-foreground)]/55">
                          Fecha
                        </p>
                        <p className="mt-0.5 text-[color:var(--color-foreground)]/75">
                          {m.match_date ?? "-"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[color:var(--color-border)]/30 px-2 py-1.5">
                        <p className="font-mono uppercase tracking-wider text-[color:var(--color-foreground)]/55">
                          Hora
                        </p>
                        <p className="mt-0.5 text-[color:var(--color-foreground)]/75">
                          {m.match_time ?? "--:--"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[color:var(--color-border)]/30 px-2 py-1.5">
                        <p className="font-mono uppercase tracking-wider text-[color:var(--color-foreground)]/55">
                          Jornada
                        </p>
                        <p className="mt-0.5 text-[color:var(--color-foreground)]/75">
                          {m.jornada}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 inline-flex rounded-full border border-[color:var(--color-border)]/40 bg-[color:var(--color-card)]/50 px-3 py-1 font-mono text-sm font-semibold text-[color:var(--color-foreground)]">
                      {m.local_score != null
                        ? `${m.local_score} - ${m.away_score}`
                        : "Sin marcador"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => handleEdit(m)}
                      >
                        <Pencil size={14} /> Editar
                      </Button>
                      <ConfirmActionDialog
                        title="Eliminar partido"
                        description={`Vas a eliminar ${local} vs ${away}, jornada ${m.jornada}. Esta acción no se puede deshacer.`}
                        confirmLabel="Eliminar"
                        confirmAction={() => handleDelete(m)}
                      >
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-full"
                        >
                          <Trash2 size={14} /> Eliminar
                        </Button>
                      </ConfirmActionDialog>
                    </div>
                  </div>
                );
              })}
            </div>

            <AdminDataTable className="hidden md:block">
              <Table>
                <caption className="sr-only">Partidos administrados</caption>
                <TableHeader>
                  <TableRow className="border-[color:var(--color-border)]/25 hover:bg-transparent">
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                      Fecha
                    </TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                      J
                    </TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                      Partido
                    </TableHead>
                    <TableHead className="hidden font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60 md:table-cell">
                      Score
                    </TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                      Estado
                    </TableHead>
                    <TableHead className="text-right font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleMatches.map((m) => {
                    const local = teamMap.get(m.local_team_id) ?? "-";
                    const away = teamMap.get(m.away_team_id) ?? "-";
                    return (
                      <TableRow
                        key={m.id}
                        className="border-[color:var(--color-border)]/20 hover:bg-[color:var(--color-primary)]/5"
                      >
                        <TableCell className="py-3">
                          <div>
                            <p className="text-[color:var(--color-foreground)]">
                              {m.match_date ?? "-"}
                            </p>
                            <p className="font-mono text-xs text-[color:var(--color-foreground)]/55">
                              {m.match_time ?? "--:--"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-[color:var(--color-foreground)]/80">
                          {m.jornada}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-[color:var(--color-foreground)]">
                              {local}
                            </p>
                            <p className="font-mono text-xs text-[color:var(--color-foreground)]/65">
                              vs {away} · {m.phase}{m.group_name ? ` · Grupo ${m.group_name}` : ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="rounded-full border border-[color:var(--color-border)]/40 bg-[color:var(--color-card)]/50 px-3 py-1 font-mono text-sm font-semibold text-[color:var(--color-foreground)]">
                            {m.local_score != null
                              ? `${m.local_score} - ${m.away_score}`
                              : "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <AdminBadge status={m.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => handleEdit(m)}
                            >
                              <Pencil size={14} />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                            <ConfirmActionDialog
                              title="Eliminar partido"
                              description={`Vas a eliminar ${local} vs ${away}, jornada ${m.jornada}. Esta acción no se puede deshacer.`}
                              confirmLabel="Eliminar"
                              confirmAction={() => handleDelete(m)}
                            >
                              <Button
                                variant="destructive"
                                size="sm"
                                className="rounded-full"
                              >
                                <Trash2 size={14} />
                                <span className="hidden sm:inline">
                                  Eliminar
                                </span>
                              </Button>
                            </ConfirmActionDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </AdminDataTable>
            <AdminPagination page={page} pageCount={pageCount} onPageChange={setPage} />
          </>
        )}
      </AdminCardContent>
    </AdminCard>
  );
}
