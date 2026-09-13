interface TeamStatsProps {
  team: {
    pos: number
    name: string
    pts: number
    pj: number
    pg: number
    pe: number
    pp: number
    gf: number
    gc: number
    dif: number
  }
}

export function TeamStats({ team }: TeamStatsProps) {
  const stats = [
    { label: "Posición", value: `${team.pos}°` },
    { label: "Puntos", value: String(team.pts) },
    { label: "PJ", value: String(team.pj) },
    { label: "PG", value: String(team.pg) },
    { label: "PE", value: String(team.pe) },
    { label: "PP", value: String(team.pp) },
    { label: "GF", value: String(team.gf) },
    { label: "GC", value: String(team.gc) },
    {
      label: "Promedio Gol",
      value: team.pj > 0 ? (team.gf / team.pj).toFixed(2) : "0.00",
    },
  ]

  return (
    <div className="bg-[color:var(--color-card)]/12 border border-[color:var(--color-border)]/20 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-[color:var(--color-border)]/20">
        <h2 className="font-serif text-xl font-bold uppercase">Estadísticas de Temporada</h2>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-px bg-[color:var(--color-border)]/10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[color:var(--color-background)] p-4 text-center"
          >
            <div className="font-serif text-xl md:text-2xl font-bold text-[color:var(--color-foreground)]">
              {stat.value}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-foreground-muted)] mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
