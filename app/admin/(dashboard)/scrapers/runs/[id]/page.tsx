"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
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
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getApiErrorMessage } from "@/lib/admin/client-errors";
import type { DiffItem, ScraperRun } from "@/lib/types/supabase";


export default function ScraperRunDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [run, setRun] = useState<ScraperRun | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/scrapers/runs/${params.id}`)
      .then(async (res) => {
        if (!res.ok) {
          toast.error(
            await getApiErrorMessage(res, "No se pudo cargar la ejecución"),
          );
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (active && data) setRun(data);
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  const loadRun = async () => {
    const res = await fetch(`/api/admin/scrapers/runs/${params.id}`);
    if (!res.ok) {
      toast.error(
        await getApiErrorMessage(res, "No se pudo cargar la ejecución"),
      );
      return;
    }
    setRun(await res.json());
  };

  const applyRun = async () => {
    setLoadingAction("apply");
    try {
      const res = await fetch(`/api/admin/scrapers/runs/${params.id}/apply`, {
        method: "POST",
      });
      if (!res.ok) {
        toast.error(await getApiErrorMessage(res, "No se pudo aplicar"));
        return;
      }
      toast.success("Cambios aplicados");
      await loadRun();
      router.refresh();
    } finally {
      setLoadingAction(null);
    }
  };

  const rejectRun = async () => {
    if (!rejectionReason.trim()) { toast.error("Escribe un motivo de rechazo"); return; }
    setLoadingAction("reject");
    try {
      const res = await fetch(`/api/admin/scrapers/runs/${params.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });
      if (!res.ok) {
        toast.error(await getApiErrorMessage(res, "No se pudo rechazar"));
        return;
      }
      toast.success("Ejecución rechazada");
      await loadRun();
      router.refresh();
    } finally {
      setLoadingAction(null);
    }
  };

  if (!run) {
    return (
      <p className="font-mono text-sm text-[color:var(--color-foreground)]/65">
        Cargando ejecución...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Ejecución ${run.scraper}`}
        description={`${new Date(run.started_at).toLocaleString()} - Duración ${run.duration_ms ?? 0} ms`}
        action={
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/admin/scrapers">
              <ArrowLeft size={14} /> Volver
            </Link>
          </Button>
        }
      />

      <div className="-mt-2">
        <AdminBadge status={run.status} />
      </div>

      {run.status === "pending_review" && (
        <div className="flex flex-wrap gap-2">
          <ConfirmActionDialog
            title="Aplicar cambios"
            description="Vas a escribir en la base de datos los cambios que detectó el scraper. Esta acción no se puede deshacer."
            confirmLabel="Aplicar"
            confirmAction={applyRun}
          >
            <Button disabled={loadingAction !== null} className="rounded-full">
              <Check size={14} />
              {loadingAction === "apply" ? "Aplicando..." : "Aplicar cambios"}
            </Button>
          </ConfirmActionDialog>
          <div className="flex w-full max-w-md gap-2">
            <Input aria-label="Motivo del rechazo" placeholder="Motivo del rechazo" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
            <Button
              variant="outline"
              onClick={rejectRun}
            disabled={loadingAction !== null}
            className="rounded-full"
          >
            <X size={14} />
            {loadingAction === "reject" ? "Rechazando..." : "Rechazar"}
            </Button>
          </div>
        </div>
      )}

      {run.status === "rejected" && run.rejection_reason && (
        <AdminCard className="border-[color:var(--color-danger)]/35 bg-[color:var(--color-danger)]/10">
          <AdminCardContent className="py-4 text-sm text-[color:var(--color-danger)]">
            Rechazada: {run.rejection_reason}
          </AdminCardContent>
        </AdminCard>
      )}

      {run.error_message && (
        <AdminCard className="border-[color:var(--color-destructive)]/35 bg-[color:var(--color-destructive)]/10">
          <AdminCardContent className="py-4 text-sm text-[color:var(--color-destructive)]">
            {run.error_message}
          </AdminCardContent>
        </AdminCard>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {([
          ["Traídos", run.summary?.fetched],
          ["Creados", run.summary?.creates],
          ["Actualizados", run.summary?.updates],
          ["Sin cambios", run.summary?.unchanged],
          ["Omitidos", run.summary?.skipped],
          ["Warnings", run.summary?.warnings],
        ] as Array<[string, number | undefined]>).map(([label, value]) => (
          <AdminCard key={label}>
            <AdminCardContent className="py-4">
              <p className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
                {label}
              </p>
              <p className="mt-1 text-3xl font-black text-[color:var(--color-foreground)]">
                {value ?? 0}
              </p>
            </AdminCardContent>
          </AdminCard>
        ))}
      </div>

      {(run.warnings?.length ?? 0) > 0 && (
        <AdminCard>
          <AdminCardHeader title="Warnings" />
          <AdminCardContent>
            <ul className="list-disc space-y-1 pl-5 font-mono text-sm text-[color:var(--color-foreground)]/75">
              {run.warnings?.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AdminCardContent>
        </AdminCard>
      )}

      <AdminCard>
        <AdminCardHeader
          title="Cambios detectados"
          description="Resumen del diff antes de aplicar en base de datos."
        />
        <AdminCardContent>
          <div className="space-y-3">
            {(run.diff ?? []).map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-[color:var(--color-border)]/30 bg-[color:var(--color-card)]/45 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[color:var(--color-foreground)]">
                      {item.label}
                    </p>
                    <p className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/55">
                      {item.entity} - {item.type}
                    </p>
                  </div>
                  {item.reason && (
                    <span className="text-sm text-[color:var(--color-destructive)]">
                      {item.reason}
                    </span>
                  )}
                </div>

                {item.changes && Object.keys(item.changes).length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table aria-label="Cambios de la ejecución" className="w-full text-sm">
                      <tbody>
                        {Object.entries(item.changes).map(([field, change]) => (
                          <tr
                            key={field}
                            className="border-t border-[color:var(--color-border)]/25"
                          >
                            <td className="py-2 font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/55">
                              {field}
                            </td>
                            <td className="py-2 text-[color:var(--color-foreground)]/55">
                              {String(change.before ?? "-")}
                            </td>
                            <td className="py-2 font-semibold text-[color:var(--color-foreground)]">
                              → {String(change.after ?? "-")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {(item.notes?.length ?? 0) > 0 && (
                  <ul className="mt-3 list-disc pl-5 font-mono text-xs text-[color:var(--color-foreground)]/65">
                    {item.notes?.map((note, noteIndex) => (
                      <li key={noteIndex}>{note}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </AdminCardContent>
      </AdminCard>
    </div>
  );
}
