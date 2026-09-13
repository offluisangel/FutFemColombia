import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/route-handler"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const nextParam = searchParams.get("next") ?? "/admin"
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/admin"

  if (code) {
    const { supabase, applyCookies } = await createClient(request)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return applyCookies(NextResponse.redirect(`${origin}${next}`))
  }

  return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`)
}
