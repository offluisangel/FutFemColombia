import { NextResponse } from "next/server";
import { CALENDAR_CACHE_CONTROL, serializeCalendar, getActiveSeasonMatches } from "@/lib/calendar";

export async function GET() {
  const result = await getActiveSeasonMatches();
  if (result.error) return new NextResponse(result.error, { status: 500 });
  return new NextResponse(serializeCalendar(result.matches), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": CALENDAR_CACHE_CONTROL,
    },
  });
}
