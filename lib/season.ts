// Helpers puros de temporada — importables desde client y server components.

export function buildSeasonLabel(name?: string | null): string {
  if (!name) return `Temporada ${new Date().getFullYear()}`;
  return name.startsWith("Temporada") ? name : `Temporada ${name}`;
}

export function seasonYear(name?: string | null): number {
  const match = name?.match(/\d{4}/);
  return match ? Number(match[0]) : new Date().getFullYear();
}