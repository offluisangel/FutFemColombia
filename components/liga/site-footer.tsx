import Link from "next/link";
import { Github, Instagram } from "lucide-react";
import { buildSeasonLabel } from "@/lib/season";
import { getActiveSeasonName } from "@/lib/get-active-season";

const SOCIAL_LINKS = [
  { Icon: Github, href: "https://github.com/offluisangel", label: "GitHub" },
  { Icon: Instagram, href: "https://www.instagram.com/offluisangel", label: "Instagram" },
];

export async function SiteFooter() {
  const seasonName = await getActiveSeasonName();

  return (
    <footer
      aria-label="Pie de página"
      className="mt-auto border-t border-[color:var(--color-border)]/20 px-4 py-6 md:px-8 md:py-8"
    >
      <div className="container mx-auto flex items-center gap-3 sm:gap-5">
        {/* Identidad → home */}
        <Link
          href="/"
          aria-label="Liga F — volver al inicio"
          className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-sm focus-visible:outline-none"
        >
          <img
            src="/icon.webp"
            alt=""
            className="h-8 w-8 rounded-full transition-transform duration-200 group-hover:scale-105"
          />
          <div>
            <p className="font-serif text-sm font-bold uppercase leading-none">Liga F</p>
            <p className="mt-0.5 hidden font-mono text-[10px] text-[color:var(--color-foreground-muted)] sm:block">
              Fútbol femenino colombiano
            </p>
          </div>
        </Link>

        {/* Redes sociales */}
        <div className="flex shrink-0 items-center gap-1.5">
          {SOCIAL_LINKS.map(({ Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-muted)]/10 px-2.5 py-2 text-[color:var(--color-foreground)] transition-all duration-150 hover:-translate-y-0.5 hover:scale-105 hover:bg-[color:var(--color-primary)] hover:text-[color:var(--color-primary-foreground)] active:scale-95 sm:px-3"
            >
              <Icon size={16} aria-hidden="true" />
              <span className="hidden font-mono text-[10px] font-semibold uppercase tracking-wider sm:inline">
                {label}
              </span>
            </a>
          ))}
        </div>

        {/* Temporada activa desde seasons (solo desktop) */}
        <p className="hidden flex-1 text-right font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-foreground-muted)] md:block">
          {buildSeasonLabel(seasonName)}
        </p>
      </div>
    </footer>
  );
}