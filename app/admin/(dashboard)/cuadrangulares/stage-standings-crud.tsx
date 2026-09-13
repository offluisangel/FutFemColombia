"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminCard, AdminCardContent, AdminCardHeader } from "@/components/admin/admin-card";
import { AdminSelect } from "@/components/admin/admin-select";
import { getApiErrorMessage } from "@/lib/admin/client-errors";
import type { StageStanding } from "@/lib/types/supabase";

type Option = { id: string; name: string; is_active?: boolean };
type Row = { team_id: string; pos: number; pts: number; pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; dif: number };

const emptyRow = (pos: number): Row => ({ team_id: "", pos, pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0 });

export function StageStandingsCrud({ rows, seasons, teams }: { rows: StageStanding[]; seasons: Option[]; teams: Option[] }) {
  const router = useRouter();
  const [seasonId, setSeasonId] = useState(seasons.find((s) => s.is_active)?.id ?? seasons[0]?.id ?? "");
  const [group, setGroup] = useState<"A" | "B">("A");
  const stage = "cuadrangular";
  const [saving, setSaving] = useState(false);

  const isGrouped = true;

  const selected = useMemo(
    () => rows.filter((r) => r.season_id === seasonId && r.stage === stage && r.group_name === group).sort((a, b) => a.pos - b.pos),
    [rows, seasonId, stage, group],
  );

  const [slots, setSlots] = useState<Row[]>(() =>
    Array.from({ length: 4 }, (_, i) => {
      const r = selected[i];
      return r ? { team_id: r.team_id, pos: r.pos, pts: r.pts, pj: r.pj, pg: r.pg, pe: r.pe, pp: r.pp, gf: r.gf, gc: r.gc, dif: r.dif } : emptyRow(i + 1);
    }),
  );

  useEffect(() => {
    const next = Array.from({ length: isGrouped ? 4 : 8 }, (_, i) => {
      const r = selected[i];
      return r ? { team_id: r.team_id, pos: i + 1, pts: r.pts, pj: r.pj, pg: r.pg, pe: r.pe, pp: r.pp, gf: r.gf, gc: r.gc, dif: r.dif } : emptyRow(i + 1);
    });
    // ensure pos is 1..N regardless of stored pos (fixes old 5..8 bug)
    next.forEach((row, idx) => (row.pos = idx + 1));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync slots with selected source
    setSlots(next);
  }, [selected, isGrouped, seasonId, stage, group]);

  const updateSlot = (idx: number, patch: Partial<Row>) => {
    setSlots((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const select = (value: string, kind: "season" | "group") => {
    if (kind === "season") setSeasonId(value);
    if (kind === "group") setGroup(value as "A" | "B");
  };

  const save = async () => {
    const filled = slots.filter((r) => r.team_id);
    if (filled.length === 0) {
      toast.error("Selecciona al menos un equipo");
      return;
    }
    // validate pos 1..N unique
    const posSet = new Set(filled.map((r) => r.pos));
    if (posSet.size !== filled.length) {
      toast.error("Posiciones duplicadas — corrige 1..4");
      return;
    }
    // validate team unique
    const teamSet = new Set(filled.map((r) => r.team_id));
    if (teamSet.size !== filled.length) {
      toast.error("Equipo repetido en el grupo");
      return;
    }
    setSaving(true);
    try {
      // re-sort by pos before save so 1,2,3,4 order is canonical
      const rowsToSave = [...filled].sort((a, b) => a.pos - b.pos).map((r, i) => ({ ...r, pos: i + 1 }));
      const res = await fetch("/api/admin/stage-standings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ season_id: seasonId, stage, group_name: isGrouped ? group : "A", rows: rowsToSave }),
      });
      if (!res.ok) {
        toast.error(await getApiErrorMessage(res, "No se pudo guardar la tabla"));
        return;
      }
      toast.success(`Grupo ${group} guardado (${rowsToSave.length} equipos)`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? "";

  return (
    <AdminCard>
      <AdminCardHeader
        title="Tabla de cuadrangulares"
        description={isGrouped ? `Grupo ${group} — 4 equipos · posiciones 1..4 según clasificación` : "Fase sin grupos"}
      />
      <AdminCardContent>
        <div className={`mb-4 grid gap-3 ${isGrouped ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          <AdminSelect aria-label="Temporada" value={seasonId} onChange={(e) => select(e.target.value, "season")}>
            <option value="">Seleccionar temporada</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.is_active ? "· activa" : ""}
              </option>
            ))}
          </AdminSelect>

          {isGrouped && (
            <div className="flex gap-2">
              {(["A", "B"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroup(g)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 font-mono text-sm font-bold uppercase tracking-wider transition-colors ${
                    group === g
                      ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]"
                      : "border-[color:var(--color-border)]/30 bg-[color:var(--color-card)]/40 text-[color:var(--color-foreground)]/70 hover:bg-[color:var(--color-card)]"
                  }`}
                >
                  Grupo {g}
                </button>
              ))}
            </div>
          )}
        </div>

        {!seasonId ? (
          <p className="py-8 text-center font-mono text-sm text-[color:var(--color-foreground)]/50">Selecciona una temporada</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border border-[color:var(--color-border)]/25 md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--color-border)]/25 bg-[color:var(--color-muted)]/20 text-left font-mono text-[11px] uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                    <th className="w-12 px-3 py-2.5 text-center">#</th>
                    <th className="px-3 py-2.5">Equipo</th>
                    <th className="w-16 px-1 py-2.5 text-center">PTS</th>
                    <th className="w-14 px-1 py-2.5 text-center">PJ</th>
                    <th className="w-12 px-1 py-2.5 text-center">G</th>
                    <th className="w-12 px-1 py-2.5 text-center">E</th>
                    <th className="w-12 px-1 py-2.5 text-center">P</th>
                    <th className="w-14 px-1 py-2.5 text-center">GF</th>
                    <th className="w-14 px-1 py-2.5 text-center">GC</th>
                    <th className="w-14 px-1 py-2.5 text-center">DG</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((row, idx) => (
                    <tr key={idx} className="border-b border-[color:var(--color-border)]/15 last:border-0 hover:bg-[color:var(--color-muted)]/10">
                      <td className="px-2 py-2 text-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--color-primary)]/10 font-mono text-xs font-bold text-[color:var(--color-primary)]">
                          {row.pos}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <AdminSelect
                          aria-label={`Equipo ${idx + 1}`}
                          value={row.team_id}
                          onChange={(e) => updateSlot(idx, { team_id: e.target.value })}
                          className="min-w-44"
                        >
                          <option value="">— Seleccionar —</option>
                          {teams
                            .slice()
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((t) => (
                              <option key={t.id} value={t.id} disabled={slots.some((s, si) => si !== idx && s.team_id === t.id)}>
                                {t.name}
                              </option>
                            ))}
                        </AdminSelect>
                      </td>
                      {(["pts", "pj", "pg", "pe", "pp", "gf", "gc", "dif"] as const).map((field) => (
                        <td key={field} className="px-1 py-1.5">
                          <Input
                            type="number"
                            value={String(row[field])}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              updateSlot(idx, { [field]: isNaN(v) ? 0 : v } as Partial<Row>);
                              if (field === "gf" || field === "gc") {
                                const gf = field === "gf" ? (isNaN(v) ? 0 : v) : row.gf;
                                const gc = field === "gc" ? (isNaN(v) ? 0 : v) : row.gc;
                                updateSlot(idx, { dif: gf - gc } as Partial<Row>);
                              }
                            }}
                            className="h-8 w-full px-1.5 text-center text-sm"
                            aria-label={`${teamName(row.team_id) || `Pos ${row.pos}`} ${field}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {slots.map((row, idx) => (
                <div key={idx} className="rounded-xl border border-[color:var(--color-border)]/25 bg-[color:var(--color-card)]/40 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--color-primary)] text-xs font-bold text-[color:var(--color-primary-foreground)]">
                      {row.pos}
                    </span>
                    <div className="flex-1">
                      <AdminSelect aria-label={`Equipo ${idx + 1}`} value={row.team_id} onChange={(e) => updateSlot(idx, { team_id: e.target.value })}>
                        <option value="">Seleccionar equipo</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id} disabled={slots.some((s, si) => si !== idx && s.team_id === t.id)}>
                            {t.name}
                          </option>
                        ))}
                      </AdminSelect>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["pts", "pj", "pg", "pe", "pp", "gf", "gc", "dif"] as const).map((field) => (
                      <label key={field} className="flex flex-col gap-1">
                        <span className="text-center font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-foreground)]/60">{field}</span>
                        <Input
                          type="number"
                          value={String(row[field])}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            const value = isNaN(v) ? 0 : v;
                            updateSlot(idx, { [field]: value } as Partial<Row>);
                            if (field === "gf" || field === "gc") {
                              const gf = field === "gf" ? value : row.gf;
                              const gc = field === "gc" ? value : row.gc;
                              updateSlot(idx, { dif: gf - gc });
                            }
                          }}
                          className="h-8 px-1 text-center text-sm"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="font-mono text-xs text-[color:var(--color-foreground)]/55">Se guarda ordenado 1..{slots.length} por posición. {selected.length ? `${selected.length} filas existentes` : "Sin datos aún para este grupo"}</p>
              <Button className="rounded-full px-6" onClick={save} disabled={saving || !seasonId}>
                {saving ? "Guardando..." : `Guardar Grupo ${group}`}
              </Button>
            </div>
          </>
        )}
      </AdminCardContent>
    </AdminCard>
  );
}
