import { NextResponse } from "next/server"
import { getStageStandings } from "@/lib/liga/cuadrangulares-data"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getStageStandings()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
