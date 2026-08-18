import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getPosts, getEvents, getBusinesses } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { isRole } from "@/lib/auth"

export const metadata: Metadata = { title: "Admin Dashboard — Pulse" }

export default async function AdminDashboardPage() {
  if (!isSupabaseConfigured()) redirect("/")
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login?next=/admin/dashboard")
  const role = data.user.user_metadata?.role
  if (!isRole(role) || role !== "admin") redirect("/")

  let posts: Awaited<ReturnType<typeof getPosts>> = []
  let events: Awaited<ReturnType<typeof getEvents>> = []
  let businesses: Awaited<ReturnType<typeof getBusinesses>> = []
  let checkIns = 0
  let profileCounts: Record<string, number> = {}
  let profileTotal = 0

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    ;[posts, events, businesses] = await Promise.all([
      getPosts(supabase),
      getEvents(supabase),
      getBusinesses(supabase),
    ])

    const { data: checkInRows, error: checkInError } = await supabase
      .from("check_ins")
      .select("id", { count: "exact" })
    if (!checkInError && checkInRows) checkIns = checkInRows.length

    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("role")
    if (!profileError && profileRows) {
      profileCounts = profileRows.reduce<Record<string, number>>((acc, r) => {
        acc[r.role] = (acc[r.role] ?? 0) + 1
        return acc
      }, {})
      profileTotal = profileRows.length
    }
  }

  const roles = [
    { role: "student", count: profileCounts.student ?? 0 },
    { role: "business", count: profileCounts.business ?? 0 },
    { role: "organization", count: profileCounts.organization ?? 0 },
    { role: "admin", count: profileCounts.admin ?? 0 },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h1 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
          / admin dashboard
        </h1>
        <p className="text-xs text-[var(--dim)] mt-0.5">community administration</p>
      </div>

      <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
        / overview
      </h2>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 mb-6">
        <div className="border border-[var(--hr)] p-3">
          <div className="text-xs text-[var(--muted)]">Active Businesses</div>
          <div className="text-lg font-bold mt-0.5">{businesses.length}</div>
        </div>
        <div className="border border-[var(--hr)] p-3">
          <div className="text-xs text-[var(--muted)]">Events</div>
          <div className="text-lg font-bold mt-0.5">{events.length}</div>
        </div>
        <div className="border border-[var(--hr)] p-3">
          <div className="text-xs text-[var(--muted)]">Posts</div>
          <div className="text-lg font-bold mt-0.5">{posts.length}</div>
        </div>
        <div className="border border-[var(--hr)] p-3">
          <div className="text-xs text-[var(--muted)]">Check-ins</div>
          <div className="text-lg font-bold mt-0.5">{checkIns}</div>
        </div>
      </div>

      <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
        / users by role
      </h2>
      <div className="border border-[var(--hr)] divide-y divide-[var(--hr)] mb-6">
        {roles.map((r) => (
          <div key={r.role} className="flex items-center justify-between px-3 py-2.5 text-xs">
            <span className="font-bold capitalize">{r.role}</span>
            <span className="text-[var(--muted)]">{r.count}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-3 py-2.5 text-xs">
          <span className="font-bold capitalize">total</span>
          <span className="text-[var(--muted)]">{profileTotal}</span>
        </div>
      </div>

      <div className="border border-dashed border-[var(--hr)] p-5 text-xs text-[var(--dim)]">
        Admin accounts are assigned manually via the Supabase dashboard.
        Future tools: user moderation, business verification, and analytics exports.
      </div>
    </div>
  )
}
