import type React from "react";
import { cn } from "@/lib/utils";

export function AdminCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[color:var(--color-border)]/35 bg-[color:var(--color-card)]/70 shadow-sm backdrop-blur-sm transition-shadow duration-200 hover:shadow-md",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function AdminCardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--color-border)]/25 px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h2 className="font-serif text-lg font-bold uppercase tracking-tight text-[color:var(--color-foreground)]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 font-mono text-xs text-[color:var(--color-foreground)]/65">
            {description}
          </p>
        )}
      </div>
      {action ? <div className="w-full sm:w-auto">{action}</div> : null}
    </div>
  );
}

export function AdminCardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
