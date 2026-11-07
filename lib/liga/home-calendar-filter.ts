import type { Matchday } from "@/components/liga/match-calendar";

export type HomeCalendarFilter = "all" | "upcoming" | "results";
export type HomeUpcomingPhase = "regular" | "cuadrangular" | "semifinales" | "final";

type UpcomingPhaseInput = {
  knockoutUpcoming?: { phase_label?: string | null; jornada?: number }[];
  cuadrangularUpcoming?: unknown[];
  upcoming?: unknown[];
  finalMatchdays?: Matchday[];
  semifinalMatchdays?: Matchday[];
  cuadrangularMatchdays?: Matchday[];
  regularMatchdays?: Matchday[];
};

function hasUnplayedMatches(matchdays: Matchday[] = []): boolean {
  return matchdays.some((day) => day.partidos.some((match) => match.local_score === null || match.away_score === null));
}

export function selectHomeUpcomingPhase(input: UpcomingPhaseInput): HomeUpcomingPhase {
  const knockoutLabel = input.knockoutUpcoming?.[0]?.phase_label?.toLowerCase() ?? "";
  if (input.knockoutUpcoming?.length) {
    if (knockoutLabel.includes("semifinal")) return "semifinales";
    if (knockoutLabel.includes("final")) return "final";
    if (hasUnplayedMatches(input.finalMatchdays)) return "final";
    if (hasUnplayedMatches(input.semifinalMatchdays)) return "semifinales";
    return "semifinales";
  }
  if (input.cuadrangularUpcoming?.length) return "cuadrangular";
  if (input.upcoming?.length) return "regular";
  if (hasUnplayedMatches(input.finalMatchdays)) return "final";
  if (hasUnplayedMatches(input.semifinalMatchdays)) return "semifinales";
  if (input.cuadrangularMatchdays?.length) return "cuadrangular";
  if (input.regularMatchdays?.length) return "regular";
  if (input.finalMatchdays?.length) return "final";
  if (input.semifinalMatchdays?.length) return "semifinales";
  return "regular";
}

export function filterHomeMatchdays(matchdays: Matchday[], filter: HomeCalendarFilter): Matchday[] {
  if (filter === "all") return matchdays;
  return matchdays.flatMap((matchday) => {
    const partidos = matchday.partidos.filter((match) => {
      const played = match.local_score !== null && match.away_score !== null;
      return filter === "results" ? played : !played;
    });
    return partidos.length ? [{ ...matchday, partidos }] : [];
  });
}
