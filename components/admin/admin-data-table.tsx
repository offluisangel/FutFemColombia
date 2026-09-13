import type React from "react"
import { cn } from "@/lib/utils"

export function AdminDataTable({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      {children}
    </div>
  )
}
