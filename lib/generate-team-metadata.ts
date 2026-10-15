export type TeamCompetitionStatus = "active" | "eliminated" | "champion"

export function generateTeamMetadata(
  teamName: string,
  status: TeamCompetitionStatus,
  year: number,
): { title: string; description: string } {
  if (status === "champion") {
    return {
      title: `${teamName}: Campeón de Liga Femenina ${year}`,
      description: `${teamName} se coronó campeón de la Liga Femenina de Colombia ${year}. Consulta sus resultados, posición final y estadísticas de la temporada.`,
    }
  }

  if (status === "eliminated") {
    return {
      title: `${teamName}: Resultados y posición final ${year}`,
      description: `Consulta resultados y posición final de ${teamName} en la Liga Femenina de Colombia ${year}, con estadísticas de su temporada.`,
    }
  }

  return {
    title: `${teamName}: Posiciones y resultados ${year}`,
    description: `Consulta posiciones, resultados y próximos partidos de ${teamName} en la Liga Femenina de Colombia ${year}. Tabla y estadísticas del equipo.`,
  }
}
