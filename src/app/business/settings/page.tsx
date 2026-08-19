import type { Metadata } from "next"
import { redirect } from "next/navigation"
import BusinessSettingsForm from "@/components/business-settings-form"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getCurrentRole } from "@/lib/business-access"

export const metadata: Metadata = { title: "Business Settings — Pulse" }

export default async function BusinessSettingsPage() {
  if (!isSupabaseConfigured()) redirect("/")
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?next=/business/settings")
  if ((await getCurrentRole(supabase, user)) !== "business") redirect("/dashboard")

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, category, description, location, phone, email, website, hours, tags, logo_url, cover_url, student_discount, qr_token")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle()

  if (!business) redirect("/business/onboarding")

  return <BusinessSettingsForm business={business} />
}
