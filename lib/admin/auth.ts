import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdminUser } from "@/lib/admin/role"

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

  if (!isAdminUser(user)) {
    return {
      user,
      response: NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "Sin permisos de administrador",
          },
        },
        { status: 403 },
      ),
    }
  }

  return { user, response: null }
}
