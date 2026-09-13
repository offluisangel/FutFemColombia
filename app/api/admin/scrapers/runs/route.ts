import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { apiError } from "@/lib/admin/api"
import { requireAdminUser } from "@/lib/admin/auth"

export async function GET(req: NextRequest) {
  const { response } = await requireAdminUser()
  if (response) return response

  const supabase = createAdminClient()
  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit") ?? 50), 1), 100)
  const offset = Math.max(Number(req.nextUrl.searchParams.get("offset") ?? 0), 0)
  const { data, error } = await supabase
    .from("scraper_runs")
    .select("id, scraper, status, started_at, finished_at, duration_ms, triggered_by, summary, warnings, error_message, applied_at, rejected_at, rejection_reason")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return apiError(error.message)
  return NextResponse.json(data ?? [])
}
