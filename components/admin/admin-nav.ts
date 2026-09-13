import type { LucideIcon } from "lucide-react"
import {
  CalendarDays,
  Database,
  LayoutDashboard,

  Shield,
  Sparkles,
  Activity,
  Medal,
  Trophy,
  GitBranch,
} from "lucide-react"

export type AdminNavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Partidos", href: "/admin/matches", icon: CalendarDays },
  { label: "Equipos", href: "/admin/teams", icon: Shield },
  { label: "Cuadrangulares", href: "/admin/cuadrangulares", icon: Trophy },
  { label: "Fase final", href: "/admin/fase-final", icon: GitBranch },
  { label: "Goleadoras", href: "/admin/scorers", icon: Medal },
  { label: "Temporadas", href: "/admin/seasons", icon: Database },
  { label: "Scrapers", href: "/admin/scrapers", icon: Sparkles },
  { label: "Actividad", href: "/admin/activity", icon: Activity },
]
