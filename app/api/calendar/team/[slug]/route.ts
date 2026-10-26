import { NextResponse } from "next/server";
import { CALENDAR_CACHE_CONTROL, serializeCalendar, getActiveSeasonMatches } from "@/lib/calendar";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) return new NextResponse("Slug de equipo inválido.", { status: 400 });
  const result = await getActiveSeasonMatches(slug);
  if (result.error) return new NextResponse(result.error, { status: 500 });
  if (result.teamFound === false) return new NextResponse("Equipo no encontrado.", { status: 404 });
  return new NextResponse(serializeCalendar(result.matches), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": CALENDAR_CACHE_CONTROL,
    },
  });
}
