import type { LucideIcon } from "lucide-react"
import { AdminCard, AdminCardContent } from "@/components/admin/admin-card"

export function AdminStatCard({
  title,
  value,
  icon: Icon,
  tone = "default",
}: {
  title: string
  value: number | string
  icon: LucideIcon
  tone?: "default" | "success" | "warning"
}) {
  const toneClass =
    tone === "success"
      ? "text-[color:var(--color-success)]"
      : tone === "warning"
        ? "text-amber-300"
        : "text-[color:var(--color-foreground)]"

  return (
    <AdminCard className="h-full">
      <AdminCardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/60">
            {title}
          </p>
          <p className={`mt-2 text-3xl font-black ${toneClass}`}>{value}</p>
        </div>
        <div className="rounded-full border border-[color:var(--color-border)]/40 bg-[color:var(--color-primary)]/10 p-2.5 text-[color:var(--color-primary)]">
          <Icon size={18} />
        </div>
      </AdminCardContent>
    </AdminCard>
  )
}
