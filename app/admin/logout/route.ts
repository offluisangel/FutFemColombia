import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/route-handler"

export async function POST(request: NextRequest) {
  const { supabase, applyCookies } = await createClient(request)
  await supabase.auth.signOut()
  const origin = new URL(request.url).origin
  return applyCookies(
    NextResponse.redirect(`${origin}/admin/login`, { status: 303 }),
  )
}
