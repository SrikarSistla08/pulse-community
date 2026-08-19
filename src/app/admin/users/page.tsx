import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { redirect } from "next/navigation"
import { isRole, type Role } from "@/lib/auth"
import AdminUsersClient from "@/components/admin-users-client"

export const metadata: Metadata = { title: "Manage Users — Pulse" }

export default async function AdminUsersPage() {
  if (!isSupabaseConfigured()) redirect("/")
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?next=/admin/users")
  const role = data.user.user_metadata?.role
  if (!isRole(role) || role !== "admin") redirect("/")

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false })

  return <AdminUsersClient users={profiles ?? []} />
}
