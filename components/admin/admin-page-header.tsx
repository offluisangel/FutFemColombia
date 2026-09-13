import type React from "react";

export function AdminPageHeader({
  eyebrow = "Panel administrador",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--color-primary)]">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-serif text-3xl font-black uppercase leading-none text-[color:var(--color-foreground)] md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-3xl font-mono text-sm text-[color:var(--color-foreground)]/70">
            {description}
          </p>
        )}
      </div>
      {action ? <div className="w-full sm:w-auto">{action}</div> : null}
    </header>
  );
}
