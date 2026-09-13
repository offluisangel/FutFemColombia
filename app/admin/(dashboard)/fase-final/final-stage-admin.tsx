"use client";

import type { Match, Season, Team } from "@/lib/types/supabase";
import { MatchesTable } from "../matches/matches-table";

export function FinalStageAdmin({
  matches,
  seasons,
  teams,
}: {
  matches: Match[];
  seasons: Season[];
  teams: Team[];
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="font-serif text-2xl font-black uppercase">Semifinales</h2>
          <p className="mt-1 font-mono text-xs text-[color:var(--color-foreground)]/65">
            Registra los dos cruces después del sorteo. Los ganadores pasan a la final.
          </p>
        </div>
        <MatchesTable
          matches={matches}
          teams={teams}
          seasons={seasons}
          initialPhase="semifinal"
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-serif text-2xl font-black uppercase">Final</h2>
          <p className="mt-1 font-mono text-xs text-[color:var(--color-foreground)]/65">
            Crea este partido cuando estén definidos los dos ganadores de semifinal.
          </p>
        </div>
        <MatchesTable
          matches={matches}
          teams={teams}
          seasons={seasons}
          initialPhase="final"
        />
      </section>
    </div>
  );
}
