"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";

export interface TeamInfo {
  id: number;
  name: string;
  slug: string;
  shield_url: string;
}

function setupMarquee(
  el: HTMLDivElement,
  opts: { hoverPause?: boolean; copies?: number } = {},
) {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (prefersReduced) return () => {};

  const copies = opts.copies ?? 2;

  let rafId: number;
  let paused = false;
  let lastTimestamp = 0;
  let scrollTimeout: ReturnType<typeof setTimeout>;
  const speed = 42;

  const resetScroll = () => {
    const step = el.scrollWidth / copies;
    if (el.scrollLeft >= step) {
      el.scrollLeft -= step;
    }
  };

  const tick = (timestamp: number) => {
    if (!paused) {
      const delta = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0;
      el.scrollLeft += speed * delta;
      resetScroll();
    }
    lastTimestamp = timestamp;
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  const onWindowScroll = () => {
    paused = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      paused = false;
    }, 150);
  };

  window.addEventListener("scroll", onWindowScroll, { passive: true });

  if (opts.hoverPause) {
    const onEnter = () => {
      paused = true;
    };
    const onLeave = () => {
      paused = false;
    };
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", onWindowScroll);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }

  const onTouchStart = () => {
    paused = true;
  };
  const onTouchEnd = () => {
    paused = false;
  };
  el.addEventListener("touchstart", onTouchStart, { passive: true });
  el.addEventListener("touchend", onTouchEnd, { passive: true });
  el.addEventListener("touchcancel", onTouchEnd, { passive: true });

  return () => {
    cancelAnimationFrame(rafId);
    clearTimeout(scrollTimeout);
    window.removeEventListener("scroll", onWindowScroll);
    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchend", onTouchEnd);
    el.removeEventListener("touchcancel", onTouchEnd);
  };
}

export function SiteHeader({ teams }: { teams: TeamInfo[] }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const leagueLogoSrc = "/icon.webp";
  const scrollRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const desktopCopies = 8;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    return setupMarquee(el);
  }, []);

  useEffect(() => {
    const el = desktopScrollRef.current;
    if (!el) return;
    return setupMarquee(el, { hoverPause: true, copies: 8 });
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[color:var(--color-background)]/95 backdrop-blur-sm border-b border-[color:var(--color-border)]/25">
      {/* Desktop: logo a la izquierda + carrusel infinito */}
      <div className="hidden md:flex items-center gap-6 px-6 py-2.5">
        <div className="flex items-center gap-1 shrink-0">
          {!isHome && (
            <Link
              href="/"
              className="flex items-center gap-1.5 bg-[color:var(--color-primary)]/15 hover:bg-[color:var(--color-primary)]/30 border border-[color:var(--color-primary)]/30 hover:border-[color:var(--color-primary)]/60 text-[color:var(--color-primary)] rounded-full px-2.5 py-1.5 mr-2 font-mono text-[11px] uppercase tracking-wider font-semibold transition-all"
            >
              <ArrowLeft size={13} />
              Volver
            </Link>
          )}
          <div className="h-10 w-10 rounded-full bg-[color:var(--color-card)]/15 border border-[color:var(--color-border)]/30 overflow-hidden flex items-center justify-center shadow-sm shrink-0">
            <img
              src={leagueLogoSrc}
              alt="Liga Femenina"
              draggable={false}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="font-serif text-lg font-bold uppercase tracking-tight text-[color:var(--color-foreground)]">
            Liga F
          </span>
        </div>

        <div className="desktop-marquee-wrapper">
          <div ref={desktopScrollRef} className="shields-scroll">
            <div className="shields-marquee">
              {Array.from({ length: desktopCopies }).map((_, ci) => (
                <div
                  key={`dc-${ci}`}
                  className="shields-group"
                  aria-hidden={ci > 0 ? "true" : undefined}
                >
                  {teams.map((team) => (
                    team.slug ? (
                      <Link
                        key={`d-${ci}-${team.name}`}
                        href={`/equipos/${team.slug}`}
                        className="block rounded-sm focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
                      >
                        <img
                          src={team.shield_url}
                          alt={team.name}
                          title={team.name}
                          draggable={false}
                          className="h-9 w-9 object-contain shrink-0 hover:scale-110 transition-transform"
                        />
                      </Link>
                    ) : (
                      <img
                        key={`d-${ci}-${team.name}`}
                        src={team.shield_url}
                        alt={team.name}
                        title={team.name}
                        draggable={false}
                        className="h-9 w-9 object-contain shrink-0"
                      />
                    )
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Link
          href="/cuadrangulares"
          className="flex items-center gap-1 bg-[color:var(--color-primary)]/10 border border-[color:var(--color-primary)]/20 text-[color:var(--color-primary)] rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider font-semibold shrink-0"
        >
          <Trophy size={18} />
        </Link>
      </div>

      {/* Mobile */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {!isHome && (
              <Link
                href="/"
                className="flex items-center gap-1 bg-[color:var(--color-primary)]/15 border border-[color:var(--color-primary)]/30 text-[color:var(--color-primary)] rounded-full px-2 py-1 mr-1 font-mono text-[10px] uppercase tracking-wider font-semibold"
              >
                <ArrowLeft size={11} />
                Volver
              </Link>
            )}
            <img
              src={leagueLogoSrc}
              alt="Liga Femenina"
              className="h-8 w-8 rounded-full"
            />
            <span className="font-serif text-lg font-bold uppercase tracking-tight">
              Liga Femenina
            </span>
          </div>
          <Link
            href="/cuadrangulares"
            className="flex items-center gap-1 bg-[color:var(--color-primary)]/10 border border-[color:var(--color-primary)]/20 text-[color:var(--color-primary)] rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider font-semibold"
          >
            <Trophy size={18} />
          </Link>
        </div>
        <div ref={scrollRef} className="shields-scroll pb-1">
          <div className="shields-marquee">
            <div className="shields-group">
              {teams.map((team) => (
                team.slug ? (
                  <Link
                    key={`a-${team.name}`}
                    href={`/equipos/${team.slug}`}
                    className="block rounded-sm focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
                  >
                    <img
                      src={team.shield_url}
                      alt={team.name}
                      title={team.name}
                      draggable={false}
                      className="h-8 w-8 object-contain shrink-0"
                    />
                  </Link>
                ) : (
                  <img
                    key={`a-${team.name}`}
                    src={team.shield_url}
                    alt={team.name}
                    title={team.name}
                    draggable={false}
                    className="h-8 w-8 object-contain shrink-0"
                  />
                )
              ))}
            </div>
            <div className="shields-group" aria-hidden="true">
              {teams.map((team) => (
                team.slug ? (
                  <Link
                    key={`b-${team.name}`}
                    href={`/equipos/${team.slug}`}
                    className="block rounded-sm focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
                    aria-hidden="true"
                    tabIndex={-1}
                  >
                    <img
                      src={team.shield_url}
                      alt=""
                      title={team.name}
                      draggable={false}
                      className="h-8 w-8 object-contain shrink-0"
                    />
                  </Link>
                ) : (
                  <img
                    key={`b-${team.name}`}
                    src={team.shield_url}
                    alt=""
                    title={team.name}
                    draggable={false}
                    className="h-8 w-8 object-contain shrink-0"
                  />
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
