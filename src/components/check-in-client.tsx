"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSupabase, useCurrentUser } from "@/lib/supabase/hooks"
import { getBusinessCheckIns, getRewardsForUser } from "@/lib/supabase/queries"
import type { Business, CheckIn, Reward } from "@/types"
import QrCode from "@/components/qr-code"
import BusinessImage from "@/components/business-image"

interface CheckInResult {
  businessName: string
  reward: Reward | null
  isFirstVisit: boolean
  visitCount: number
}

interface CheckInClientProps {
  userId: string
  businesses: Business[]
  history: CheckIn[]
  rewards: Reward[]
}

export default function CheckInClient({
  userId,
  businesses: initialBusinesses,
  history: initialHistory,
  rewards: initialRewards,
}: CheckInClientProps) {
  const supabase = useSupabase()
  const user = useCurrentUser()
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [rewards, setRewards] = useState<Reward[]>(initialRewards)
  const [history, setHistory] = useState<CheckIn[]>(initialHistory)
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [checkingIn, setCheckingIn] = useState<string | null>(null)

  useEffect(() => {
    const bid = new URLSearchParams(window.location.search).get("business")
    if (bid) {
      setHighlight(bid)
      setTimeout(() => {
        document
          .getElementById(`checkin-row-${bid}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 150)
    }
  }, [])

  async function handleCheckIn(business: Business) {
    if (!supabase || !user) {
      setError("you must be signed in to check in")
      return
    }

    setError("")
    setCheckingIn(business.id)
    const response = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: business.id }),
    })
    const body = await response.json().catch(() => null)
    setCheckingIn(null)

    if (!response.ok) {
      setError(body?.error ?? "could not complete check-in")
      return
    }

    const [checkIns, userRewards] = await Promise.all([
      getBusinessCheckIns(supabase, user.id),
      getRewardsForUser(supabase, user.id),
    ])
    setHistory(checkIns)
    setRewards(userRewards)
    const reward = body.reward
      ? userRewards.find((item) => item.code === body.reward.code) ?? body.reward
      : null
    setResult({
      businessName: business.name,
      reward,
      isFirstVisit: Boolean(body.isFirstVisit),
      visitCount: body.visitCount ?? 1,
    })
  }

  function closeResult() {
    setResult(null)
  }

  return (
    <main className="pulse-shell max-w-4xl">
      <div className="pulse-page-header">
        <div>
        <p className="pulse-kicker">community action</p>
        <h1 className="pulse-title">Check in nearby</h1>
        <p className="pulse-lede">
          scan your first visit to unlock a reward ·{" "}
          <Link href="/pass" className="text-[var(--fg)] underline">
            view community pass &rarr;
          </Link>
        </p>
        </div>
      </div>

      {error && <p className="mb-4 border border-[var(--post-event)] p-2 text-xs text-[var(--post-event)]">{error}</p>}

      <div className="pulse-card mb-6 flex items-center gap-5 p-5 sm:p-7">
        <div className="shrink-0 border border-[var(--hr)] bg-[var(--surface)] p-2">
          <QrCode value={`pulse:check-in:${user?.id ?? "member"}`} size={112} />
        </div>
        <div>
          <p className="pulse-kicker">your Pulse pass</p>
          <p className="mt-2 text-xl font-bold tracking-tight">Show this at a local spot.</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Your visits and rewards stay connected to your account.</p>
        </div>
      </div>

      <div className="pulse-section mt-0">
        <h3 className="pulse-kicker mb-2">
          / check in at a business
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {businesses.map((biz) => (
            <div key={biz.id} id={`checkin-row-${biz.id}`} className="pulse-card flex items-center justify-between gap-3 p-4 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <BusinessImage name={biz.name} category={biz.category} logoUrl={biz.logo} className={`h-7 w-7 shrink-0 object-cover ${highlight === biz.id ? "border-[var(--fg)]" : "border-[var(--hr)]"}`} />
                <div className="min-w-0">
                  <div className={`font-bold truncate ${highlight === biz.id ? "underline" : ""}`}>
                    {biz.name}
                  </div>
                  <div className="text-[10px] text-[var(--muted)]">
                    {rewards.some((reward) => reward.businessId === biz.id) ? "reward unlocked" : "first visit unlocks 10% off"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleCheckIn(biz)}
                disabled={checkingIn === biz.id}
                className="pulse-button pulse-button-primary shrink-0"
              >
                {checkingIn === biz.id ? "checking..." : "check in"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {rewards.length > 0 && (
        <div id="rewards" className="pulse-section">
          <h3 className="pulse-kicker mb-2">
            / your rewards
          </h3>
          <div className="pulse-card divide-y divide-[var(--hr)]">
            {rewards.map((r) => {
              const biz = businesses.find((b) => b.id === r.businessId)
              return (
                <div key={r.code} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <div className="min-w-0">
                    <div className="font-bold">&#127881; {biz?.name ?? "Business"}</div>
                    <div className="text-[10px] text-[var(--muted)]">{r.label}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold tracking-widest">{r.code}</div>
                    <div className="text-[10px] text-[var(--muted)]">show at counter</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="pulse-section">
          <h3 className="pulse-kicker mb-2">
            / recent check-ins
          </h3>
          <div className="pulse-card divide-y divide-[var(--hr)]">
          {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--muted)]">&#10003;</span>
                  <span className="font-bold">{h.businessName}</span>
                </div>
                <span className="text-[var(--muted)]">{h.createdAt ? new Date(h.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm border border-[var(--bg)] bg-[var(--bg)] p-6 text-center">
            {result.reward ? (
              <>
                <div className="text-3xl mb-2">&#127881;</div>
                <p className="text-sm font-bold mb-1">First visit — reward unlocked!</p>
                <p className="text-xs text-[var(--muted)] mb-3">
                  {result.businessName}
                </p>
                <div className="border border-dashed border-[var(--fg)] p-3 mb-3">
                  <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1">
                    {result.reward.label}
                  </div>
                  <div className="text-lg font-bold tracking-widest">{result.reward.code}</div>
                </div>
                <p className="text-[11px] text-[var(--muted)] mb-4">
                  Show this code at the counter to get {result.reward.discount}
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">&#10003;</div>
                <p className="text-sm font-bold mb-1">Checked in at {result.businessName}</p>
                <p className="text-xs text-[var(--muted)] mb-4">
                  visit #{result.visitCount} &middot; welcome back!
                </p>
              </>
            )}
            <button
              onClick={closeResult}
              className="pulse-button pulse-button-primary w-full"
            >
              [ done ]
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
