import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import DashboardBody from "@/components/dashboard-body"

export const metadata: Metadata = { title: "Business Dashboard — Pulse" }

export default async function BusinessDashboardPage() {
  if (!isSupabaseConfigured()) redirect("/")
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?next=/business/dashboard")

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle()

  if (!business) redirect("/business/onboarding")

  return <DashboardBody role="business" />
}
