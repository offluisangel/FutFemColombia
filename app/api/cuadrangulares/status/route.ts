import { NextResponse } from "next/server"
import { getFinalStageStatus } from "@/lib/liga/cuadrangulares-data"

export type FinalStageStatus = "not_started" | "groups_running" | "semifinals_running" | "final_running" | "finished"

export async function GET() {
  try {
    const data = await getFinalStageStatus()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
