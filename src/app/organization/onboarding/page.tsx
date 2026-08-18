import type { Metadata } from "next"
import { redirect } from "next/navigation"
import OrganizationOnboardingForm from "@/components/organization-onboarding-form"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getCurrentRole } from "@/lib/business-access"
import { homeForRole } from "@/lib/auth"

export const metadata: Metadata = { title: "Organization Onboarding — Pulse" }

export default async function OrganizationOnboardingPage() {
  if (!isSupabaseConfigured()) redirect("/")
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?next=/organization/onboarding")

  const role = await getCurrentRole(supabase, user)
  if (role !== "organization") redirect(homeForRole(role))

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle()

  if (org) redirect("/organization/dashboard")

  return <OrganizationOnboardingForm />
}
