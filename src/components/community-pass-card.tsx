"use client"

import { useEffect, useState } from "react"
import { useSupabase, useCurrentUser } from "@/lib/supabase/hooks"
import { getBusinesses, getBusinessCheckIns, getRewardsForUser } from "@/lib/supabase/queries"
import { getAttendedEvents, getVolunteerHours, addVolunteerHours } from "@/lib/rewards"
import QrCode from "@/components/qr-code"
import BusinessImage from "@/components/business-image"
import type { Business, CheckIn, Reward } from "@/types"

interface Props {
  onStatsUpdate?: (stats: { businessesVisited: number; offersUsed: number }) => void
}

const RANKS = [
  { name: "Newcomer", min: 0, color: "var(--dim)" },
  { name: "Regular", min: 5, color: "var(--muted)" },
  { name: "Insider", min: 15, color: "var(--post-event)" },
  { name: "VIP", min: 30, color: "#b8860b" },
  { name: "Legend", min: 50, color: "#8b5cf6" },
]

function getRank(points: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].min) return RANKS[i]
  }
  return RANKS[0]
}

function getProgress(points: number) {
  const rank = getRank(points)
  const idx = RANKS.indexOf(rank)
  if (idx === RANKS.length - 1) return 100
  const next = RANKS[idx + 1]
  const inRank = points - rank.min
  const range = next.min - rank.min
  return Math.round((inRank / range) * 100)
}

export default function CommunityPassCard({ onStatsUpdate }: Props) {
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
    return () => { active = false }
  }, [supabase, user])

  const attended = mounted ? getAttendedEvents() : []
  const volunteerHours = mounted ? getVolunteerHours() : 0
  const visitedBusinessIds = [...new Set(checkins.map((c) => c.businessId))]
  const offersRedeemed = rewards.filter((r) => r.redeemed).length

  const points = visitedBusinessIds.length * 1 + offersRedeemed * 2 + attended.length * 2 + volunteerHours * 1
  const rank = getRank(points)
  const progress = getProgress(points)
  const nextRank = RANKS[RANKS.indexOf(rank) + 1]

  if (!user) return null

  return (
    <div className="space-y-4">
      {/* QR Pass Card */}
      <div className="pulse-card flex items-center gap-4 p-4 sm:p-5">
        <div className="border border-[var(--hr)] p-2 shrink-0">
          <QrCode value={`${typeof window !== "undefined" ? window.location.origin : ""}/pass?user=${user.id}`} size={80} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-0.5">member</div>
          <div className="text-sm font-bold truncate">
            {user.user_metadata?.full_name ?? "Community Member"} · #{user.id.slice(0, 4).toUpperCase()}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: rank.color }}
            >
              {rank.name}
            </span>
            <span className="text-[10px] text-[var(--dim)]">{points} pts</span>
          </div>
        </div>
      </div>

      {/* Rank Progress */}
      <div className="px-1">
        <div className="flex items-center justify-between text-[10px] text-[var(--muted)] mb-1">
          <span style={{ color: rank.color }}>{rank.name}</span>
          {nextRank && <span>{nextRank.name} ({nextRank.min} pts)</span>}
        </div>
        <div className="h-1 bg-[var(--hr)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: rank.color }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 border border-[var(--hr)]">
          <p className="text-lg font-bold">{visitedBusinessIds.length}</p>
          <p className="text-[9px] text-[var(--muted)] uppercase tracking-wider">visited</p>
        </div>
        <div className="text-center p-2 border border-[var(--hr)]">
          <p className="text-lg font-bold">{offersRedeemed}</p>
          <p className="text-[9px] text-[var(--muted)] uppercase tracking-wider">used</p>
        </div>
        <div className="text-center p-2 border border-[var(--hr)]">
          <p className="text-lg font-bold">{attended.length}</p>
          <p className="text-[9px] text-[var(--muted)] uppercase tracking-wider">events</p>
        </div>
        <div className="text-center p-2 border border-[var(--hr)]">
          <p className="text-lg font-bold">{volunteerHours}</p>
          <p className="text-[9px] text-[var(--muted)] uppercase tracking-wider">hours</p>
        </div>
      </div>

      {/* Businesses Visited */}
      {visitedBusinessIds.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">businesses visited</h3>
          <div className="border border-[var(--hr)] divide-y divide-[var(--hr)]">
            {visitedBusinessIds.map((bizId) => {
              const biz = businesses.find((b) => b.id === bizId)
              return (
                <div key={bizId} className="flex items-center justify-between px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <BusinessImage name={biz?.name ?? "Business"} category={biz?.category} logoUrl={biz?.logo} className="h-5 w-5 shrink-0 object-cover duotone" />
                    <span className="font-bold truncate">{biz?.name ?? "Unknown"}</span>
                  </div>
                  <span className="text-[var(--dim)]">&#10003;</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Events + Volunteer Hours */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">events attended</h3>
          <div className="border border-[var(--hr)] divide-y divide-[var(--hr)]">
            {attended.length > 0 ? attended.map((a) => (
              <div key={a.id} className="px-3 py-2 text-xs">
                <span className="font-bold truncate block">{a.title}</span>
                <span className="text-[10px] text-[var(--dim)]">{a.time}</span>
              </div>
            )) : (
              <div className="px-3 py-2 text-xs text-[var(--dim)]">none yet</div>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">volunteer hours</h3>
          <div className="border border-[var(--hr)] divide-y divide-[var(--hr)]">
            <div className="px-3 py-2 text-xs">
              <span className="font-bold">{volunteerHours} hrs</span>
            </div>
            <div className="px-3 py-2 text-xs flex gap-1">
              {[1, 2, 3].map((h) => (
                <button
                  key={h}
                  onClick={() => { addVolunteerHours(h); setTick((t) => t + 1) }}
                  className="border border-[var(--hr)] px-2 py-0.5 text-[10px] hover:border-[var(--fg)] transition-colors"
                >
                  +{h}h
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
