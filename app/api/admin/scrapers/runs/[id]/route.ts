import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { apiError } from "@/lib/admin/api"
import { requireAdminUser } from "@/lib/admin/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminUser()
  if (response) return response

  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("scraper_runs")
    .select("*")
    .eq("id", id)
    .single()

  if (error) return apiError(error.message, 404, "NOT_FOUND")
  return NextResponse.json(data)
}
