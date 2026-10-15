export function buildMatchYoutubeSearchUrl(
  local: string,
  visitante: string,
  seasonYear: number,
) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(local)}+vs+${encodeURIComponent(visitante)}+Liga+Femenina+${seasonYear}`;
}
