import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import DashboardBody from "@/components/dashboard-body"

export const metadata: Metadata = { title: "Organization Dashboard — Pulse" }

export default async function OrganizationDashboardPage() {
  if (!isSupabaseConfigured()) redirect("/")
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?next=/organization/dashboard")

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle()

  if (!org) redirect("/organization/onboarding")

  return <DashboardBody role="organization" />
}
