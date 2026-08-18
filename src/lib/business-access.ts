import type { SupabaseClient, User } from "@supabase/supabase-js"
import { isRole, type Role } from "@/lib/auth"

export async function getCurrentRole(
  supabase: SupabaseClient,
  user: User
): Promise<Role> {
  const metadataRole = user.user_metadata?.role
  if (isRole(metadataRole)) return metadataRole

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  return isRole(data?.role) ? data.role : "student"
}

export async function canManageBusiness(
  supabase: SupabaseClient,
  user: User,
  businessId: string
): Promise<boolean> {
  const role = await getCurrentRole(supabase, user)
  if (role === "admin") return true
  if (role !== "business") return false

  const { data } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .maybeSingle()

  return Boolean(data)
}
