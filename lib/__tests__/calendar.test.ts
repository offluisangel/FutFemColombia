import { describe, expect, it } from "vitest";
import { serializeCalendar, type CalendarMatch } from "@/lib/calendar";

const base: CalendarMatch = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  seasonId: "season",
  jornada: 1,
  phase: "regular",
  localTeamId: "a",
  awayTeamId: "b",
  localTeamName: "Atlético, Norte",
  awayTeamName: "Las Valientes",
  localScore: null,
  awayScore: null,
  matchDate: "2026-03-08",
  matchTime: "14:30:00",
  status: "scheduled",
};

describe("serializeCalendar", () => {
  it("uses stable UIDs, Bogota times, escaping, and CRLF", () => {
    const output = serializeCalendar([base], new Date("2026-01-01T00:00:00Z"));
    expect(output).toContain("UID:123e4567-e89b-12d3-a456-426614174000@futfemcolombia.site");
    expect(output).toContain("DTSTART;TZID=America/Bogota:20260308T143000");
    expect(output).toContain("SUMMARY:Atlético\\, Norte vs Las Valientes");
    expect(output).toContain("\r\n");
    expect(output.endsWith("\r\n")).toBe(true);
  });

  it("publishes missing time as an all-day event", () => {
    const output = serializeCalendar([{ ...base, matchTime: null }]);
    expect(output).toContain("DTSTART;VALUE=DATE:20260308");
    expect(output).toContain("DTEND;VALUE=DATE:20260309");
    expect(output).toContain("DESCRIPTION:Jornada 1 · Fase: regular · Hora por confirmar");
  });

  it("keeps postponed and cancelled matches with their stable identity", () => {
    const output = serializeCalendar([{ ...base, status: "postponed" }, { ...base, status: "cancelled", id: "different" }]);
    expect(output).toContain("STATUS:TENTATIVE");
    expect(output).toContain("STATUS:CANCELLED");
    expect(output).toContain("UID:123e4567-e89b-12d3-a456-426614174000@futfemcolombia.site");
  });

  it("includes the final score in completed events", () => {
    const output = serializeCalendar([{ ...base, status: "played", localScore: 3, awayScore: 2 }]);
    expect(output).toContain("SUMMARY:Atlético\\, Norte 3–2 Las Valientes");
    expect(output).toContain("STATUS:CONFIRMED");
  });
});
