import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"
import type { NextResponse } from "next/server"

export async function createClient(request: NextRequest) {
  const pendingCookies: { name: string; value: string; options?: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet)
        },
      },
    },
  )

  return {
    supabase,
    applyCookies(response: NextResponse) {
      for (const { name, value, options } of pendingCookies) {
        response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
      }
      return response
    },
  }
}
