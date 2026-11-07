import { describe, expect, it } from "vitest";
import { filterHomeMatchdays, selectHomeUpcomingPhase } from "@/lib/liga/home-calendar-filter";
import type { Matchday } from "@/components/liga/match-calendar";

const day = (jornada: number, scores: [number | null, number | null][]) => ({
  jornada, fecha: "2026-06-01", partidos: scores.map(([local_score, away_score]) => ({
    local: "Local", visitante: "Visitante", shield_local: "", shield_away: "", fecha: "2026-06-01", hora: "18:00", local_score, away_score,
  })),
});
const matchdays: Matchday[] = [day(1, [[0, 0], [2, 1], [null, 3]]), day(2, [[null, null]]), day(3, [[4, null]])];

describe("filterHomeMatchdays", () => {
  it("preserves all dates by default and does not mutate source data", () => {
    expect(filterHomeMatchdays(matchdays, "all")).toEqual(matchdays);
    expect(matchdays[0].partidos).toHaveLength(3);
  });
  it("filters played matches only when both scores exist, including 0-0", () => {
    expect(filterHomeMatchdays(matchdays, "results").map((d) => [d.jornada, d.partidos.length])).toEqual([[1, 2]]);
  });
  it("treats partial scores as upcoming and removes empty matchdays", () => {
    expect(filterHomeMatchdays(matchdays, "upcoming").map((d) => [d.jornada, d.partidos.length])).toEqual([[1, 1], [2, 1], [3, 1]]);
    expect(filterHomeMatchdays(matchdays.slice(0, 1), "results")).toEqual([day(1, [[0, 0], [2, 1]])]);
  });
});

describe("selectHomeUpcomingPhase", () => {
  it("prefers the phase of actual knockout fixtures over completed final records", () => {
    const final = day(1, [[1, 0]]);
    const semifinals = day(2, [[null, null]]);
    expect(selectHomeUpcomingPhase({
      knockoutUpcoming: [{ phase_label: "Semifinales", jornada: 2 }],
      finalMatchdays: [final], semifinalMatchdays: [semifinals],
    })).toBe("semifinales");
  });
  it("falls back to upcoming groups and then regular fixtures", () => {
    expect(selectHomeUpcomingPhase({ cuadrangularUpcoming: [{ jornada: 1 }] })).toBe("cuadrangular");
    expect(selectHomeUpcomingPhase({ upcoming: [{ jornada: 1 }] })).toBe("regular");
  });
});
