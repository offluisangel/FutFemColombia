import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <span className="relative block w-full">
      <select
        {...props}
        className={cn(
          "h-9 w-full appearance-none rounded-md border border-[color:var(--color-input)] bg-[color:var(--color-card)] px-3 pr-8 text-sm text-[color:var(--color-foreground)] outline-none transition-colors focus-visible:border-[color:var(--color-ring)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]/50 [&>option]:bg-[color:var(--color-card)] [&>option]:text-[color:var(--color-foreground)]",
          className,
        )}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-foreground)]/60"
      />
    </span>
  );
}