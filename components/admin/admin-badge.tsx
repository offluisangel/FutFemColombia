import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  played:
    "border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/12 text-[color:var(--color-success)]",
  scheduled:
    "border-amber-400/30 bg-amber-400/12 text-amber-300",
  live:
    "border-[color:var(--color-primary)]/35 bg-[color:var(--color-primary)]/12 text-[color:var(--color-primary)]",
  active:
    "border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/12 text-[color:var(--color-success)]",
  inactive:
    "border-[color:var(--color-border)]/60 bg-[color:var(--color-muted)]/30 text-[color:var(--color-foreground)]/70",
  readonly:
    "border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]",
  pending_review:
    "border-amber-400/30 bg-amber-400/12 text-amber-300",
  applied:
    "border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/12 text-[color:var(--color-success)]",
  rejected:
    "border-[color:var(--color-border)]/60 bg-[color:var(--color-muted)]/30 text-[color:var(--color-foreground)]/70",
  failed:
    "border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/12 text-[color:var(--color-danger)]",
}

const STATUS_LABELS: Record<string, string> = {
  played: "Jugado",
  live: "En vivo",
  scheduled: "Programado",
  active: "Activa",
  applying: "Aplicando",
  inactive: "Inactiva",
  readonly: "Solo lectura",
  pending_review: "Pendiente",
  applied: "Aplicado",
  rejected: "Rechazado",
  failed: "Falló",
}

export function AdminBadge({
  status,
  label,
  className,
}: {
  status: string
  label?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide",
        STATUS_STYLES[status] ??
          "border-[color:var(--color-border)]/60 bg-[color:var(--color-muted)]/20 text-[color:var(--color-foreground)]/70",
        className,
      )}
    >
      {label ?? STATUS_LABELS[status] ?? status}
    </span>
  )
}
