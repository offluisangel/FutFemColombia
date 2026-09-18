"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

// Paleta del tema (globals.css).
const COLORS = ["#f371e2", "#ea3dd7", "#f592e7", "#6ee7a0", "#ff6b8a", "#fdecfa"];

export function ChampionConfetti() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const count = 200;
    const defaults = { origin: { y: 0.25 }, colors: COLORS };

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    };

    // Secuencia "realista", ajustada sobre el hero.
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });

    return () => {
      confetti.reset();
    };
  }, []);

  return null;
}
