import { NextResponse } from "next/server";
import { CALENDAR_CACHE_CONTROL, serializeCalendar, getMatch } from "@/lib/calendar";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Identificador de partido inválido.", { status: 400 });
  const result = await getMatch(id);
  if (result.error) return new NextResponse(result.error, { status: 500 });
  if (!result.match) return new NextResponse("Partido no encontrado.", { status: 404 });
  return new NextResponse(serializeCalendar([result.match]), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="partido-${id}.ics"`,
      "Cache-Control": CALENDAR_CACHE_CONTROL,
    },
  });
}
