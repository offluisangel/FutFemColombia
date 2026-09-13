"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { AdminBadge } from "@/components/admin/admin-badge";
import {
  AdminCard,
  AdminCardContent,
  AdminCardHeader,
} from "@/components/admin/admin-card";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { getApiErrorMessage } from "@/lib/admin/client-errors";
import type { Season } from "@/lib/types/supabase";
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


export function SeasonsTable({ seasons: initial }: { seasons: Season[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Season | null>(null);
  const [form, setForm] = useState({ name: "", is_active: false });

  const resetForm = () => {
    setForm({ name: "", is_active: false });
    setEditing(null);
  };

  const handleEdit = (s: Season) => {
    setEditing(s);
    setForm({ name: s.name, is_active: s.is_active });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const url = editing
      ? `/api/admin/seasons?id=${editing.id}`
      : "/api/admin/seasons";
    const method = editing ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        toast.error(
          await getApiErrorMessage(res, "Error al guardar temporada"),
        );
        return;
      }

      toast.success(editing ? "Temporada actualizada" : "Temporada creada");
      setOpen(false);
      resetForm();
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (season: Season) => {
    const res = await fetch(`/api/admin/seasons?id=${season.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const message = await getApiErrorMessage(
        res,
        "Error al eliminar temporada",
      );
      toast.error(message);
      throw new Error(message);
    }

    toast.success(`Temporada eliminada: ${season.name}`);
    router.refresh();
  };

  return (
    <AdminCard>
      <AdminCardHeader
        title="Listado de temporadas"
        description="Define periodos de competencia y marca cuál está activa."
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
                <Plus size={14} /> Nueva temporada
              </Button>
            </DialogTrigger>
            <DialogContent className="border-[color:var(--color-border)]/40 bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl font-bold uppercase">
                  {editing ? "Editar" : "Nueva"} temporada
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <AdminFormField label="Nombre">
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </AdminFormField>

                <label className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/35 bg-[color:var(--color-card)]/45 px-3 py-2">
                  <Checkbox
                    checked={form.is_active}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, is_active: Boolean(checked) })
                    }
                  />
                  <span className="font-mono text-sm text-[color:var(--color-foreground)]/75">
                    Marcar como temporada activa
                  </span>
                </label>

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
                    {saving ? "Guardando..." : editing ? "Guardar" : "Crear"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <AdminCardContent>
        {initial.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[color:var(--color-border)]/50 bg-[color:var(--color-muted)]/25 p-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)]">
              <CalendarPlus size={16} />
            </div>
            <p className="font-serif text-xl font-bold uppercase">
              Sin temporadas
            </p>
            <p className="mt-1 font-mono text-sm text-[color:var(--color-foreground)]/60">
              Crea una temporada para habilitar la gestión de partidos.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {initial.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-[color:var(--color-border)]/35 bg-[color:var(--color-card)]/45 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[color:var(--color-foreground)]">
                      {s.name}
                    </p>
                    <AdminBadge status={s.is_active ? "active" : "inactive"} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleEdit(s)}
                    >
                      <Pencil size={14} /> Editar
                    </Button>
                    <ConfirmActionDialog
                      title="Eliminar temporada"
                      description={`Vas a eliminar la temporada “${s.name}”. Si tiene partidos asociados, la operación será bloqueada.`}
                      confirmLabel="Eliminar"
                      confirmAction={() => handleDelete(s)}
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
              ))}
            </div>

            <AdminDataTable className="hidden md:block">
              <Table>
                <caption className="sr-only">Temporadas administradas</caption>
                <TableHeader>
                  <TableRow className="border-[color:var(--color-border)]/25 hover:bg-transparent">
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                      Temporada
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
                  {initial.map((s) => (
                    <TableRow
                      key={s.id}
                      className="border-[color:var(--color-border)]/20 hover:bg-[color:var(--color-primary)]/5"
                    >
                      <TableCell className="py-3 font-semibold text-[color:var(--color-foreground)]">
                        {s.name}
                      </TableCell>
                      <TableCell>
                        <AdminBadge
                          status={s.is_active ? "active" : "inactive"}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleEdit(s)}
                          >
                            <Pencil size={14} /> Editar
                          </Button>
                          <ConfirmActionDialog
                            title="Eliminar temporada"
                            description={`Vas a eliminar la temporada “${s.name}”. Si tiene partidos asociados, la operación será bloqueada.`}
                            confirmLabel="Eliminar"
                            confirmAction={() => handleDelete(s)}
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
