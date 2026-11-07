import type { Scorer } from "@/components/liga/scorers-table";

export function HomeScorerHighlights({ scorers }: { scorers: Scorer[] }) {
  const leaders = scorers.slice(0, 3);
  if (leaders.length === 0) return null;

  return (
    <section aria-labelledby="scorer-highlights-title" className="mb-6">
      <h2 id="scorer-highlights-title" className="mb-4 font-serif text-2xl font-bold">
        Las goleadoras destacadas
      </h2>
      <ol className="grid gap-3 sm:grid-cols-2">
        {leaders.map((scorer, index) => (
          <li
            key={scorer.player_id}
            className={`rounded-2xl border border-[color:var(--color-border)]/20 bg-[color:var(--color-card)]/12 p-4 ${index === 0 ? "sm:col-span-2 sm:flex sm:items-center sm:justify-between sm:px-6" : ""}`}
          >
            <div>
              <p className="font-mono text-xs text-[color:var(--color-foreground-muted)]">
                Posición {scorer.pos}
              </p>
              <h3 className={`mt-1 font-serif font-bold ${index === 0 ? "text-2xl" : "text-lg"}`}>
                {scorer.name}
              </h3>
              <p className="mt-1 font-mono text-sm text-[color:var(--color-foreground-muted)]">
                {scorer.team_name}
              </p>
            </div>
            <p className="mt-3 font-mono text-sm text-[color:var(--color-foreground-muted)] sm:mt-0">
              <strong className="text-2xl text-[color:var(--color-primary)]">{scorer.goals}</strong> goles
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
