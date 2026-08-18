import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getBusinesses, getBusinessCheckIns, getRewardsForUser } from "@/lib/supabase/queries"
import CheckInClient from "@/components/check-in-client"

export const metadata: Metadata = {
  title: "Check-In — Pulse",
  description: "Check in at local businesses and unlock rewards.",
}

export default async function CheckInPage() {
  if (!isSupabaseConfigured()) redirect("/login")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/check-in")

  const [businesses, history, rewards] = await Promise.all([
    getBusinesses(supabase, user.id),
    getBusinessCheckIns(supabase, user.id),
    getRewardsForUser(supabase, user.id),
  ])

  return (
    <CheckInClient
      userId={user.id}
      businesses={businesses}
      history={history}
      rewards={rewards}
    />
  )
}
