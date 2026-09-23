import type { LucideIcon } from "lucide-react"
import {
  Activity,
  CalendarDays,
  Database,
  GitBranch,
  LayoutDashboard,
  Medal,
  Shield,
  Table2,
  Trophy,
} from "lucide-react"

export type AdminNavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export type AdminNavGroup = {
  label: string
  items: AdminNavItem[]
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Inicio",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Competencia",
    items: [
      { label: "Posiciones", href: "/admin/standings", icon: Table2 },
      { label: "Partidos", href: "/admin/matches", icon: CalendarDays },
      { label: "Goleadoras", href: "/admin/scorers", icon: Medal },
      { label: "Cuadrangulares", href: "/admin/cuadrangulares", icon: Trophy },
      { label: "Fase final", href: "/admin/fase-final", icon: GitBranch },
    ],
  },
  {
    label: "Configuración",
    items: [
      { label: "Equipos", href: "/admin/teams", icon: Shield },
      { label: "Temporadas", href: "/admin/seasons", icon: Database },
    ],
  },
  {
    label: "Operaciones",
    items: [{ label: "Actividad", href: "/admin/activity", icon: Activity }],
  },
]

export const ADMIN_NAV: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap(
  (group) => group.items,
)
