"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Medal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { AdminCard, AdminCardContent, AdminCardHeader } from "@/components/admin/admin-card";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { AdminSelect } from "@/components/admin/admin-select";
import { getApiErrorMessage } from "@/lib/admin/client-errors";
import type { Scorer } from "@/lib/types/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Option = { id: string; name: string; is_active?: boolean };
type Form = { season_id: string; player_id: string; name: string; team_id: string; team_name: string; goals: string; pos: string };
const emptyForm: Form = { season_id: "", player_id: "", name: "", team_id: "", team_name: "", goals: "0", pos: "0" };

export function ScorersTable({ scorers: initial, seasons, teams }: { scorers: Scorer[]; seasons: Option[]; teams: Option[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Scorer | null>(null);
  const [seasonFilter, setSeasonFilter] = useState("");
  const [form, setForm] = useState<Form>(emptyForm);
  const activeSeasonId = seasons.find((s) => s.is_active)?.id ?? "";
  const reset = () => { setForm({ ...emptyForm, season_id: activeSeasonId || seasons[0]?.id || "" }); setEditing(null); };
  const edit = (scorer: Scorer) => { setEditing(scorer); setForm({ season_id: scorer.season_id, player_id: String(scorer.player_id), name: scorer.name, team_id: scorer.team_id ?? "", team_name: scorer.team_name ?? "", goals: String(scorer.goals), pos: String(scorer.pos) }); setOpen(true); };
  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/scorers?id=${editing.id}` : "/api/admin/scorers", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { toast.error(await getApiErrorMessage(res, "Error al guardar goleadora")); return; }
      toast.success(editing ? "Goleadora actualizada" : "Goleadora creada"); setOpen(false); reset(); router.refresh();
    } finally { setSaving(false); }
  };
  const remove = async (scorer: Scorer) => {
    const res = await fetch(`/api/admin/scorers?id=${scorer.id}`, { method: "DELETE" });
    if (!res.ok) { const message = await getApiErrorMessage(res, "Error al eliminar goleadora"); toast.error(message); throw new Error(message); }
    toast.success(`Goleadora eliminada: ${scorer.name}`); router.refresh();
  };
  const visible = seasonFilter ? initial.filter((s) => s.season_id === seasonFilter) : initial;
  const field = (key: keyof Form, label: string, type = "text") => <AdminFormField key={key} label={label}><Input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></AdminFormField>;
  return <AdminCard>
    <AdminCardHeader title="Listado de goleadoras" description="Posición, goles y equipo por temporada." action={<Button className="rounded-full" onClick={() => { reset(); setOpen(true); }}><Plus size={14} /> Nueva goleadora</Button>} />
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogContent className="border-[color:var(--color-border)]/40 bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
        <DialogHeader><DialogTitle className="font-serif text-2xl font-bold uppercase">{editing ? "Editar" : "Nueva"} goleadora</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <AdminFormField label="Temporada"><AdminSelect value={form.season_id} onChange={(e) => setForm({ ...form, season_id: e.target.value })}>{seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</AdminSelect></AdminFormField>
            <AdminFormField label="Equipo"><AdminSelect value={form.team_id} onChange={(e) => setForm({ ...form, team_id: e.target.value, team_name: teams.find((t) => t.id === e.target.value)?.name ?? "" })}><option value="">Sin equipo</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</AdminSelect></AdminFormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {field("name", "Jugadora")}
            {field("player_id", "ID de jugadora (interno)", "number")}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {field("goals", "Goles", "number")}{field("pos", "Posición", "number")}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button className="rounded-full" onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <AdminCardContent>
      <div className="mb-4 max-w-xs"><AdminSelect aria-label="Filtrar por temporada" value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)}><option value="">Todas las temporadas</option>{seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</AdminSelect></div>
      {visible.length === 0 ? (
        <AdminEmptyState icon={<Medal size={16} />} title="Sin goleadoras" description="Añade la primera estadística individual." />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {visible.map((s) => (
              <div key={s.id} className="rounded-xl border border-[color:var(--color-border)]/35 bg-[color:var(--color-card)]/45 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.name}</p>
                    <p className="truncate font-mono text-xs text-[color:var(--color-foreground)]/60">{s.team_name ?? "Sin equipo"}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[color:var(--color-primary)]/15 px-2 py-1 font-mono text-xs text-[color:var(--color-primary)]">#{s.pos || "-"}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="font-mono text-sm"><span className="text-2xl font-black">{s.goals}</span> goles</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => edit(s)}><Pencil size={14} /> Editar</Button>
                    <ConfirmActionDialog title="Eliminar goleadora" description={`Vas a eliminar a “${s.name}”.`} confirmLabel="Eliminar" confirmAction={() => remove(s)}><Button variant="destructive" size="sm" className="rounded-full"><Trash2 size={14} /> Eliminar</Button></ConfirmActionDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <AdminDataTable className="hidden md:block">
            <table className="w-full text-sm"><caption className="sr-only">Goleadoras registradas</caption><thead><tr className="border-b text-left font-mono text-xs uppercase"><th className="py-2">Pos</th><th>Jugadora</th><th>Equipo</th><th>Goles</th><th className="text-right">Acciones</th></tr></thead><tbody>{visible.map((s) => <tr key={s.id} className="border-b border-[color:var(--color-border)]/20"><td className="py-3">{s.pos || "-"}</td><td className="font-semibold">{s.name}</td><td>{s.team_name ?? "-"}</td><td>{s.goals}</td><td><div className="flex justify-end gap-2"><Button variant="outline" size="sm" className="rounded-full" onClick={() => edit(s)}><Pencil size={14} /> Editar</Button><ConfirmActionDialog title="Eliminar goleadora" description={`Vas a eliminar a “${s.name}”.`} confirmLabel="Eliminar" confirmAction={() => remove(s)}><Button variant="destructive" size="sm" className="rounded-full"><Trash2 size={14} /> Eliminar</Button></ConfirmActionDialog></div></td></tr>)}</tbody></table>
          </AdminDataTable>
        </>
      )}
    </AdminCardContent>
  </AdminCard>;
}