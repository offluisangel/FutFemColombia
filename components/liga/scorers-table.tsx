"use client";

import { useState } from "react";

export interface Scorer {
  pos: number;
  player_id: number;
  name: string;
  team_name: string;
  goals: number;
  photo_url: string | null;
}

function PlayerPhoto({ name, src }: { name: string; src: string | null }) {
  const [failed, setFailed] = useState(!src);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (failed) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-primary)]/20 font-serif text-sm font-bold text-[color:var(--color-primary)]">
        {initial}
      </span>
    );
  }

  return (
    <img
      src={src ?? ""}
      alt={`Foto de ${name}`}
      onError={() => setFailed(true)}
      className="h-8 w-8 shrink-0 rounded-full object-cover"
    />
  );
}

export function ScorersTable({ scorers }: { scorers: Scorer[] }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-[color:var(--color-border)]/20 bg-[color:var(--color-card)]/12">
      <div className="border-b border-[color:var(--color-border)]/20 p-6">
        <h2 className="font-serif text-2xl font-bold uppercase md:text-3xl">Goleadoras</h2>
        <p className="mt-2 font-mono text-sm text-[color:var(--color-foreground-muted)]">
          Top 10 goleadoras de la Liga 2026
        </p>
      </div>
      {scorers.length === 0 ? (
        <p className="p-6 text-center font-mono text-sm text-[color:var(--color-foreground-muted)]">
          La tabla de goleadoras estará disponible cuando inicie la competición.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-[color:var(--color-border)]/20 text-left font-mono text-xs uppercase text-[color:var(--color-foreground-muted)]">
                <th className="w-12 px-4 py-3 text-center">#</th>
                <th className="w-[42%] px-2 py-3 sm:px-4">Jugadora</th>
                <th className="w-[32%] px-2 py-3 sm:px-4">Equipo</th>
                <th className="w-14 px-2 py-3 text-center sm:px-4">Goles</th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((scorer) => (
                <tr key={scorer.player_id} className="border-b border-[color:var(--color-border)]/10 last:border-0 hover:bg-[color:var(--color-card)]/12">
                  <td className="px-4 py-3 text-center font-mono text-sm text-[color:var(--color-foreground-muted)]">{scorer.pos}</td>
                  <td className="min-w-0 px-2 py-3 sm:px-4">
                    <div className="flex min-w-0 items-center gap-2 font-mono text-sm font-medium sm:gap-3">
                      <PlayerPhoto name={scorer.name} src={scorer.photo_url} />
                      <span className="min-w-0 truncate">{scorer.name}</span>
                    </div>
                  </td>
                  <td className="min-w-0 px-2 py-3 font-mono text-sm text-[color:var(--color-foreground-muted)] sm:px-4">
                    <span className="block truncate">{scorer.team_name}</span>
                  </td>
                  <td className="px-2 py-3 text-center font-mono text-lg font-bold text-[color:var(--color-primary)] sm:px-4">{scorer.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
