"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSupabase, useCurrentUser } from "@/lib/supabase/hooks"
import { getBusinesses, getBusinessCheckIns, getRewardsForUser } from "@/lib/supabase/queries"
import {
  getAttendedEvents,
  getVolunteerHours,
  addVolunteerHours,
} from "@/lib/rewards"
import QrCode from "@/components/qr-code"
import type { Business, CheckIn, Reward } from "@/types"
import BusinessImage from "@/components/business-image"

export default function CommunityPass() {
  const supabase = useSupabase()
  const user = useCurrentUser()
  const [mounted, setMounted] = useState(false)
  const [, setTick] = useState(0)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])

  useEffect(() => {
    if (!supabase || !user) return
    let active = true
    Promise.all([
      getBusinesses(supabase, user.id),
      getBusinessCheckIns(supabase, user.id),
      getRewardsForUser(supabase, user.id),
    ]).then(([biz, userCheckins, userRewards]) => {
      if (!active) return
      setBusinesses(biz)
      setCheckins(userCheckins)
      setRewards(userRewards)
      setMounted(true)
    })
    return () => {
      active = false
    }
  }, [supabase, user])

  const attended = mounted ? getAttendedEvents() : []
  const volunteerHours = mounted ? getVolunteerHours() : 0
  const visitedBusinessIds = [...new Set(checkins.map((c) => c.businessId))]

  function logHours(h: number) {
    addVolunteerHours(h)
    setTick((t) => t + 1)
  }

  return (
    <main className="pulse-shell max-w-4xl">
      <div className="pulse-page-header">
        <div>
        <p className="pulse-kicker">membership</p>
        <h1 className="pulse-title">Community pass</h1>
        <p className="pulse-lede">
          your living record of the arbutus community
        </p>
        </div>
      </div>

      <Link href="/check-in" className="text-xs text-[var(--muted)] hover:underline inline-block mb-5">
        &rarr; scan a QR to check in
      </Link>

      <div className="pulse-card mb-6 flex items-center gap-5 p-5 sm:p-7">
        <div className="border border-[var(--hr)] p-2 shrink-0">
          <QrCode value={`pulse:pass:${user?.id ?? "guest"}`} size={96} />
        </div>
        <div className="text-xs text-[var(--muted)] leading-relaxed">
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1">member</div>
          <div className="text-sm font-bold text-[var(--fg)]">
            {user?.user_metadata?.full_name ?? "Community Member"} · #{user?.id.slice(0, 4).toUpperCase() ?? "0000"}
          </div>
          <div className="mt-1">show this pass when volunteering or attending events to get credit</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
        <Stat label="Businesses Visited" value={visitedBusinessIds.length} />
        <Stat label="Rewards" value={rewards.length} />
        <Stat label="Events Attended" value={attended.length} />
        <Stat label="Volunteer Hours" value={volunteerHours} />
      </div>

      {visitedBusinessIds.length > 0 && (
          <div className="pulse-section mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
            / businesses visited
          </h3>
          <div className="border border-[var(--hr)] divide-y divide-[var(--hr)]">
            {visitedBusinessIds.map((bizId) => {
              const biz = businesses.find((b) => b.id === bizId)
              return (
                <div key={bizId} className="flex items-center justify-between px-3 py-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <BusinessImage name={biz?.name ?? "Business"} category={biz?.category} logoUrl={biz?.logo} className="h-6 w-6 shrink-0 object-cover duotone" />
                    <span className="font-bold truncate">{biz?.name ?? "Unknown"}</span>
                  </div>
                  <span className="text-[var(--muted)]">&#10003; visited</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
          <div className="pulse-section mt-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
            / events attended
          </h3>
          <div className="border border-[var(--hr)] divide-y divide-[var(--hr)]">
            {attended.length > 0 ? (
              attended.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="font-bold truncate">{a.title}</span>
                  <span className="text-[var(--muted)]">{a.time}</span>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-[var(--dim)]">no events attended yet</div>
            )}
          </div>
        </div>

          <div className="pulse-section mt-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
            / volunteer hours
          </h3>
          <div className="border border-[var(--hr)] divide-y divide-[var(--hr)]">
            <div className="px-3 py-2 text-xs">
              <span className="text-[var(--muted)]">current total</span>{" "}
              <span className="font-bold">{volunteerHours} hrs</span>
            </div>
            <div className="px-3 py-2 text-xs">
              <span className="text-[var(--muted)] mr-2">log hours:</span>
              <button
                onClick={() => logHours(1)}
                className="border border-[var(--hr)] px-1.5 py-0.5 hover:border-[var(--fg)] mr-1"
              >
                +1h
              </button>
              <button
                onClick={() => logHours(2)}
                className="border border-[var(--hr)] px-1.5 py-0.5 hover:border-[var(--fg)] mr-1"
              >
                +2h
              </button>
              <button
                onClick={() => logHours(3)}
                className="border border-[var(--hr)] px-1.5 py-0.5 hover:border-[var(--fg)]"
              >
                +3h
              </button>
            </div>
          </div>
        </div>
      </div>

      {checkins.length > 0 && (
        <div className="pulse-section">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
            / check-in history
          </h3>
          <div className="pulse-card divide-y divide-[var(--hr)]">
            {[...checkins].reverse().map((c, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--muted)]">&#10003;</span>
                  <span className="font-bold">{c.businessName}</span>
                </div>
                <span className="text-[var(--muted)]">{c.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-[var(--hr)] p-3">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="text-lg font-bold mt-0.5">{value}</div>
    </div>
  )
}
