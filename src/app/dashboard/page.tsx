import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { homeForRole, isRole, type Role } from "@/lib/auth"
import DashboardBody from "@/components/dashboard-body"

export default async function DashboardPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      redirect("/login?next=/dashboard")
    }

    let role: Role | null = isRole(data.user.user_metadata?.role)
      ? data.user.user_metadata.role
      : null

    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle()
      role = isRole(profile?.role) ? profile.role : "student"
    }

    if (role === "business") {
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", data.user.id)
        .limit(1)
        .maybeSingle()
      redirect(business ? "/business/dashboard" : "/business/onboarding")
    }

    redirect(homeForRole(role))
  }

  return <DashboardBody role="student" />
}
