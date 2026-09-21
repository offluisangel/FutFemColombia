interface Standing {
  pos: number;
  name: string;
  pts: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
}

interface ResultMatch {
  local: string;
  golesLocal: number;
  visitante: string;
  golesVisitante: number;
}

interface ResultJornada {
  jornada: number;
  fecha: string;
  partidos: ResultMatch[];
}

export function generateTeamDescription(
  nombreCompleto: string,
  team: Standing,
  results: ResultJornada[],
  competitionStatus: "active" | "eliminated" | "champion" = "active",
  year = new Date().getFullYear(),
): string {
  const lines: string[] = [];

  lines.push(
    `${nombreCompleto} disputa la Liga Femenina Colombiana ${year} y se ubica en el ${team.pos}° lugar con ${team.pts} puntos. En ${team.pj} partidos, acumula ${team.pg} victorias, ${team.pe} empates y ${team.pp} derrotas, con ${team.gf} goles a favor, ${team.gc} en contra y una diferencia de ${team.dif > 0 ? "+" : ""}${team.dif}.`,
  );

  const streak = calculateStreak(team.name, results);
  if (streak) {
    lines.push(streak);
  }

  if (competitionStatus === "champion") {
    lines.push(`Con ese rendimiento, cerró la campaña como campeón de la Liga Femenina Colombiana ${year}.`);
  } else if (competitionStatus === "active") {
    lines.push("Sigue en competencia esta temporada.");
  } else {
    lines.push(`Su participación en la temporada ${year} ya finalizó, esta es el balance completo de su temporada.`);
  }

  if (competitionStatus === "active") {
    lines.push("Aquí puedes seguir sus próximos partidos, los resultados recientes y sus estadísticas actualizadas.");
  } else {
    lines.push("Aquí puedes consultar sus resultados y resumen estadístico de toda la temporada.");
  }

  return lines.join(" ");
}

function calculateStreak(
  teamName: string,
  results: ResultJornada[],
): string | null {
  const allMatches: { won: boolean }[] = [];

  for (const jornada of results) {
    for (const partido of jornada.partidos) {
      if (partido.local === teamName) {
        allMatches.push({ won: partido.golesLocal > partido.golesVisitante });
      } else if (partido.visitante === teamName) {
        allMatches.push({ won: partido.golesVisitante > partido.golesLocal });
      }
    }
  }

  if (allMatches.length === 0) return null;

  let count = 0;
  const lastResult = allMatches[allMatches.length - 1];
  for (let i = allMatches.length - 1; i >= 0; i--) {
    if (allMatches[i].won === lastResult.won) {
      count++;
    } else {
      break;
    }
  }

  if (count >= 2) {
    if (lastResult.won) {
      return `Llega en buen momento con ${count} victorias consecutivas.`;
    } else {
      return `Busca recuperarse tras ${count} derrotas consecutivas.`;
    }
  }

  return null;
}
