import { describe, it, expect } from "vitest";
import { formatMatchDate } from "../format-date";

describe("formatMatchDate", () => {
  it("returns empty string for empty date", () => {
    expect(formatMatchDate("")).toBe("");
  });

  it("returns the raw date string if parsing fails", () => {
    expect(formatMatchDate("not-a-date")).toBe("not-a-date");
  });

  it("formats a date without time", () => {
    const result = formatMatchDate("2026-08-12");
    expect(result).toMatch(/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s\d{1,2}\s[a-záéíóúñ]+$/i);
  });

  it("PM hours display in 12-hour format", () => {
    // 20:00 Bogota local time = 8 PM
    const result = formatMatchDate("2026-08-12", "20:00");
    expect(result).toContain("8:00 PM");
  });

  it("noon displays as 12:00 PM", () => {
    const result = formatMatchDate("2026-08-12", "12:00");
    expect(result).toContain("12:00 PM");
  });

  it("midnight displays as 12:00 AM", () => {
    const result = formatMatchDate("2026-08-12", "00:00");
    expect(result).toContain("12:00 AM");
  });

  it("early morning hours display correctly", () => {
    // 08:30 Bogota
    const result = formatMatchDate("2026-08-12", "08:30");
    expect(result).toContain("8:30 AM");
  });

  it("late night hours display correctly", () => {
    // 23:45 Bogota
    const result = formatMatchDate("2026-08-12", "23:45");
    expect(result).toContain("11:45 PM");
  });

  it("time with seconds parses correctly", () => {
    const result = formatMatchDate("2026-08-12", "15:30:00");
    expect(result).toContain("3:30 PM");
  });

  it("formatted string uses 12-hour time without emoji separator when time is given", () => {
    const result = formatMatchDate("2026-08-12", "20:00");
    expect(result).toContain("8:00 PM");
    expect(result).not.toContain("⚽");
    expect(result).not.toContain("·");
  });

  it("formatted string has no separator when time is omitted", () => {
    const result = formatMatchDate("2026-08-12");
    expect(result).not.toContain("⚽");
    expect(result).not.toContain("·");
  });
});
