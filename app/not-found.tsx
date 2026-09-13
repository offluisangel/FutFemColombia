import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Página no encontrada",
  description:
    "Estás fuera de juego. La página que buscas no existe en Liga Femenina de Colombia. El enlace cambió, la dirección es incorrecta o la página fue eliminada.",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="fixed top-6 left-6 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[color:var(--color-border)]/30 bg-[color:var(--color-card)]/15">
          <img src="/icon.webp" alt="" className="h-full w-full object-contain" />
        </div>
        <span className="font-serif text-base font-bold uppercase tracking-tight text-[color:var(--color-foreground)]">
          Liga F
        </span>
      </div>

      <div className="relative mb-10 h-48 w-72 md:h-64 md:w-96">
        <div className="absolute inset-0 rounded-[1px] border-2 border-[color:var(--color-border)]/20" />
        <div className="absolute bottom-0 left-1/2 top-0 border-l border-[color:var(--color-border)]/10" />

        <div className="absolute left-1/2 top-0 h-[22%] w-[55%] -translate-x-1/2 border-b-2 border-l-2 border-r-2 border-[color:var(--color-border)]/15" />
        <div className="absolute bottom-0 left-1/2 h-[22%] w-[55%] -translate-x-1/2 border-l-2 border-r-2 border-t-2 border-[color:var(--color-border)]/15" />

        <div className="absolute left-1/2 top-1/2 aspect-square w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[color:var(--color-border)]/15" />
        <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--color-border)]/15" />

        <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center">
          <span className="font-serif text-6xl font-bold text-[color:var(--color-primary)] md:text-8xl">
            404
          </span>
        </div>
      </div>

      <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--color-primary)] md:text-sm">
        OFFSIDE!
      </p>

      <p className="max-w-xs text-center font-mono text-sm leading-relaxed text-[color:var(--color-foreground)]/55 md:max-w-sm">
        La página que buscas no existe. El enlace cambió, la
        dirección es incorrecta o la página fue eliminada.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/15 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[color:var(--color-primary)] transition-all hover:border-[color:var(--color-primary)]/60 hover:bg-[color:var(--color-primary)]/30"
      >
        <ArrowLeft size={14} />
        Volver al inicio
      </Link>
    </div>
  )
}
