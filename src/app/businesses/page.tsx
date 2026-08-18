import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getBusinesses } from "@/lib/supabase/queries"
import BusinessesClient from "@/components/businesses-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Businesses — Pulse",
  description: "Find your next favorite local business.",
}

export default async function BusinessesPage() {
  let businesses: Awaited<ReturnType<typeof getBusinesses>> = []

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    businesses = await getBusinesses(supabase, user?.id ?? null)
  }

  return <BusinessesClient businesses={businesses} />
}
