import type { SupabaseClient } from "@supabase/supabase-js"

type AuditParams = {
  supabase: SupabaseClient
  userId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  before?: unknown
  after?: unknown
  metadata?: Record<string, unknown>
}

export async function logAdminAction({
  supabase,
  userId,
  action,
  entityType,
  entityId,
  before,
  after,
  metadata = {},
}: AuditParams) {
  const { error } = await supabase.from("admin_audit_log").insert({
    user_id: userId ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    before: before ?? null,
    after: after ?? null,
    metadata,
  })

  if (error) {
    console.error("Admin audit log error:", error)
  }
}
