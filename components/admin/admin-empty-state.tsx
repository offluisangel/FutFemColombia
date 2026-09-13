import type React from "react";
import { cn } from "@/lib/utils";

export function AdminEmptyState({ icon, title, description, className }: { icon?: React.ReactNode; title: string; description: string; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-dashed border-[color:var(--color-border)]/50 bg-[color:var(--color-muted)]/25 p-8 text-center", className)}>
      {icon && <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)]">{icon}</div>}
      <p className="font-serif text-xl font-bold uppercase">{title}</p>
      <p className="mt-1 font-mono text-sm text-[color:var(--color-foreground)]/75">{description}</p>
    </div>
  );
}
