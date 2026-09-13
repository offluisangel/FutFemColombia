import React from "react"
import { cn } from "@/lib/utils"

function fieldId(label: string) {
  return `admin-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
}

export function AdminFormField({
  label,
  help,
  children,
  className,
}: {
  label: string
  help?: string
  children: React.ReactNode
  className?: string
}) {
  const id = fieldId(label)
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/75">
        {label}
      </label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ id?: string }>, { id })
        : children}
      {help && (
        <p className="font-mono text-[11px] text-[color:var(--color-foreground)]/55">
          {help}
        </p>
      )}
    </div>
  )
}
