"use client"

import { useEffect, useState } from "react"
import { useSupabase, useCurrentUser } from "@/lib/supabase/hooks"
import { getRewardsForUser, getBusinessCheckIns } from "@/lib/supabase/queries"
import type { Reward } from "@/types"

export default function RewardsSummary() {
  const supabase = useSupabase()
  const user = useCurrentUser()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [checkinCount, setCheckinCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!supabase) return
    let active = true

    Promise.all([
      getRewardsForUser(supabase, user?.id ?? null),
      getBusinessCheckIns(supabase, user?.id ?? null),
    ]).then(([r, c]) => {
      if (active) {
        setRewards(r)
        setCheckinCount(c.length)
        setMounted(true)
      }
    })

    return () => {
      active = false
    }
  }, [supabase, user])

  return (
    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 mb-6">
      <div className="border border-[var(--hr)] p-3">
        <div className="text-xs text-[var(--muted)]">Rewards Unlocked</div>
        <div className="text-lg font-bold mt-0.5">{mounted ? rewards.length : "—"}</div>
      </div>
      <div className="border border-[var(--hr)] p-3">
        <div className="text-xs text-[var(--muted)]">Total Check-ins</div>
        <div className="text-lg font-bold mt-0.5">{mounted ? checkinCount : "—"}</div>
      </div>
      <div className="border border-[var(--hr)] p-3 col-span-2 sm:col-span-1">
        <div className="text-xs text-[var(--muted)]">Rewards</div>
        <div className="mt-1.5 text-xs space-y-1">
          {!mounted ? (
            <span className="text-[var(--muted)]">—</span>
          ) : rewards.length === 0 ? (
            <span className="text-[var(--muted)]">none yet — check in to unlock</span>
          ) : (
            rewards.map((r) => (
              <div key={r.code} className="flex justify-between">
                <span className="text-[var(--muted)]">{r.businessName}</span>
                <span className="font-bold tracking-widest">{r.code}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
