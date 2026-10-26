import { describe, expect, it } from "vitest";
import { buildMatchYoutubeSearchUrl } from "../youtube-search";

describe("buildMatchYoutubeSearchUrl", () => {
  it("preserves the YouTube search URL format used by the match cards", () => {
    expect(buildMatchYoutubeSearchUrl("Cali", "América", 2026)).toBe(
      "https://www.youtube.com/results?search_query=Cali+vs+Am%C3%A9rica+Liga+Femenina+2026",
    );
  });

  it("encodes team names while keeping the query separators", () => {
    expect(buildMatchYoutubeSearchUrl("Santa Fe", "Independiente Medellín", 2025)).toBe(
      "https://www.youtube.com/results?search_query=Santa%20Fe+vs+Independiente%20Medell%C3%ADn+Liga+Femenina+2025",
    );
  });
});
