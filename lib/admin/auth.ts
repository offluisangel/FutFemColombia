import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function requireAdminUser() {
  const supabase = await createClient()
  let user = null

  try {
    const result = await supabase.auth.getUser()
    user = result.data?.user ?? null
  } catch {
    // getUser() failed — session likely invalid
  }

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "No autorizado" } },
        { status: 401 },
      ),
    }
  }

  return { user, response: null }
}
