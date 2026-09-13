import { NextResponse } from "next/server"
import { getBracket } from "@/lib/liga/cuadrangulares-data"

export async function GET() {
  try {
    const data = await getBracket()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
