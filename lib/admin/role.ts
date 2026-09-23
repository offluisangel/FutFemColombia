/**
 * Role helper shared between middleware (edge) and server code.
 * Only `app_metadata.role` is trusted: `user_metadata` is user-writable
 * through `supabase.auth.updateUser()`, so checking it would be a
 * privilege-escalation hole.
 */
export type AuthUserLike = {
  app_metadata?: Record<string, unknown> | null
}

export function isAdminUser(user: AuthUserLike | null | undefined): boolean {
  return user?.app_metadata?.role === "admin"
}