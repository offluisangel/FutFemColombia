"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import {
  AdminCard,
  AdminCardContent,
  AdminCardHeader,
} from "@/components/admin/admin-card";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { getApiErrorMessage } from "@/lib/admin/client-errors";
import type { Team } from "@/lib/types/supabase";
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


export function TeamsTable({ teams: initial }: { teams: Team[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [form, setForm] = useState({
    name: "",
    full_name: "",
    slug: "",
    city: "",
    shield_url: "",
  });

  const resetForm = () => {
    setForm({ name: "", full_name: "", slug: "", city: "", shield_url: "" });
    setEditing(null);
  };

  const handleEdit = (t: Team) => {
    setEditing(t);
    setForm({
      name: t.name,
      full_name: t.full_name,
      slug: t.slug,
      city: t.city ?? "",
      shield_url: t.shield_url ?? "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const url = editing
      ? `/api/admin/teams?id=${editing.id}`
      : "/api/admin/teams";
    const method = editing ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        toast.error(await getApiErrorMessage(res, "Error al guardar equipo"));
        return;
      }

      toast.success(editing ? "Equipo actualizado" : "Equipo creado");
      setOpen(false);
      resetForm();
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (team: Team) => {
    const res = await fetch(`/api/admin/teams?id=${team.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const message = await getApiErrorMessage(res, "Error al eliminar equipo");
      toast.error(message);
      throw new Error(message);
    }

    toast.success(`Equipo eliminado: ${team.name}`);
    router.refresh();
  };

  return (
    <AdminCard>
      <AdminCardHeader
        title="Listado de equipos"
        description="Administra identidad y datos base de cada club."
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
                <Plus size={14} /> Nuevo equipo
              </Button>
            </DialogTrigger>
            <DialogContent className="border-[color:var(--color-border)]/40 bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl font-bold uppercase">
                  {editing ? "Editar" : "Nuevo"} equipo
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <AdminFormField
                  label="Nombre"
                  help="Nombre corto visible en tablas."
                >
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </AdminFormField>
                <AdminFormField label="Nombre completo">
                  <Input
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                  />
                </AdminFormField>
                <AdminFormField
                  label="Slug"
                  help="Se usa para URL pública del equipo."
                >
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </AdminFormField>
                <AdminFormField label="Ciudad">
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </AdminFormField>
                <AdminFormField
                  label="URL del escudo"
                  help="Imagen del escudo del equipo (png, svg, webp)."
                >
                  <div className="flex items-center gap-3">
                    {form.shield_url ? (
                      <img
                        src={form.shield_url}
                        alt="Vista previa"
                        className="h-10 w-10 rounded-full border border-[color:var(--color-border)]/40 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-muted)] text-[color:var(--color-foreground)]/55">
                        <ImageIcon size={14} />
                      </div>
                    )}
                    <Input
                      value={form.shield_url}
                      onChange={(e) =>
                        setForm({ ...form, shield_url: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </AdminFormField>
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
              <Shield size={16} />
            </div>
            <p className="font-serif text-xl font-bold uppercase">
              Sin equipos
            </p>
            <p className="mt-1 font-mono text-sm text-[color:var(--color-foreground)]/60">
              Crea el primer equipo para comenzar a cargar partidos y
              posiciones.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {initial.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-[color:var(--color-border)]/35 bg-[color:var(--color-card)]/45 p-3"
                >
                  <div className="flex items-center gap-3">
                    {t.shield_url ? (
                      <img
                        src={t.shield_url}
                        alt={t.name}
                        className="h-9 w-9 rounded-full object-contain"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-muted)] text-[color:var(--color-foreground)]/55">
                        <Shield size={14} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[color:var(--color-foreground)]">
                        {t.name}
                      </p>
                      <p className="truncate font-mono text-xs text-[color:var(--color-foreground)]/55">
                        {t.full_name}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-[color:var(--color-border)]/30 px-2 py-1.5">
                      <p className="font-mono uppercase tracking-wider text-[color:var(--color-foreground)]/55">
                        Slug
                      </p>
                      <p className="mt-0.5 truncate text-[color:var(--color-foreground)]/75">
                        {t.slug}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[color:var(--color-border)]/30 px-2 py-1.5">
                      <p className="font-mono uppercase tracking-wider text-[color:var(--color-foreground)]/55">
                        Ciudad
                      </p>
                      <p className="mt-0.5 truncate text-[color:var(--color-foreground)]/75">
                        {t.city ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleEdit(t)}
                    >
                      <Pencil size={14} /> Editar
                    </Button>
                    <ConfirmActionDialog
                      title="Eliminar equipo"
                      description={`Vas a eliminar el equipo “${t.name}”. Esta acción puede afectar partidos y posiciones asociadas.`}
                      confirmLabel="Eliminar"
                      confirmAction={() => handleDelete(t)}
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
                <caption className="sr-only">Equipos administrados</caption>
                <TableHeader>
                  <TableRow className="border-[color:var(--color-border)]/25 hover:bg-transparent">
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                      Equipo
                    </TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                      Slug
                    </TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                      Ciudad
                    </TableHead>
                    <TableHead className="text-right font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initial.map((t) => (
                    <TableRow
                      key={t.id}
                      className="border-[color:var(--color-border)]/20 hover:bg-[color:var(--color-primary)]/5"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          {t.shield_url ? (
                            <img
                              src={t.shield_url}
                              alt={t.name}
                              className="h-8 w-8 rounded-full object-contain"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-muted)] text-[color:var(--color-foreground)]/55">
                              <Shield size={14} />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-[color:var(--color-foreground)]">
                              {t.name}
                            </p>
                            <p className="font-mono text-xs text-[color:var(--color-foreground)]/55">
                              {t.full_name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full border border-[color:var(--color-border)]/40 bg-[color:var(--color-muted)]/35 px-2 py-1 font-mono text-xs text-[color:var(--color-foreground)]/70">
                          {t.slug}
                        </span>
                      </TableCell>
                      <TableCell className="text-[color:var(--color-foreground)]/70">
                        {t.city ?? "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleEdit(t)}
                          >
                            <Pencil size={14} /> Editar
                          </Button>
                          <ConfirmActionDialog
                            title="Eliminar equipo"
                            description={`Vas a eliminar el equipo “${t.name}”. Esta acción puede afectar partidos y posiciones asociadas.`}
                            confirmLabel="Eliminar"
                            confirmAction={() => handleDelete(t)}
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
