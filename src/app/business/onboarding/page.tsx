import type { Metadata } from "next"
import { redirect } from "next/navigation"
import BusinessOnboardingForm from "@/components/business-onboarding-form"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getCurrentRole } from "@/lib/business-access"
import { homeForRole } from "@/lib/auth"

export const metadata: Metadata = { title: "Business Onboarding — Pulse" }

export default async function BusinessOnboardingPage() {
  if (!isSupabaseConfigured()) redirect("/")
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?next=/business/onboarding")

  const role = await getCurrentRole(supabase, user)
  if (role !== "business") redirect(homeForRole(role))

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle()

  if (business) redirect("/business/dashboard")

  return <BusinessOnboardingForm />
}
