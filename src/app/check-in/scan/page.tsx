"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSupabase, useCurrentUser } from "@/lib/supabase/hooks"
import QrCode from "@/components/qr-code"
import Link from "next/link"

export default function ScanPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = useSupabase()
  const user = useCurrentUser()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "success" | "error" | "login" | "no-token">("loading")
  const [businessName, setBusinessName] = useState("")
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [visitCount, setVisitCount] = useState(0)

  useEffect(() => {
    if (!token) { setStatus("no-token"); return }
    if (!user) { setStatus("login"); return }
    if (!supabase) return

    let active = true

    async function scan() {
      // Look up business by qr_token
      const { data: business } = await supabase!
        .from("businesses")
        .select("id, name")
        .eq("qr_token", token)
        .maybeSingle()

      if (!active || !business) { setStatus("error"); return }

      // Check if user already has a reward (not first visit)
      const { data: existingReward } = await supabase!
        .from("rewards")
        .select("id")
        .eq("user_id", user!.id)
        .eq("business_id", business.id)
        .maybeSingle()

      const firstVisit = !existingReward

      // Insert check-in
      const { error } = await supabase!
        .from("check_ins")
        .insert({ user_id: user!.id, business_id: business.id })

      if (!active) return
      if (error) { setStatus("error"); return }

      // Count total visits
      const { count } = await supabase!
        .from("check_ins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("business_id", business.id)

      // Create reward on first visit
      if (firstVisit) {
        const code = `PULSE-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        await supabase!
          .from("rewards")
          .insert({
            user_id: user!.id,
            business_id: business.id,
            code,
            label: "10% off your first visit",
            discount: "10%",
          })
      }

      if (!active) return
      setBusinessName(business.name)
      setIsFirstVisit(firstVisit)
      setVisitCount(count ?? 1)
      setStatus("success")
    }

    scan()
    return () => { active = false }
  }, [supabase, user, token])

  if (status === "no-token") {
    return (
      <main className="pulse-shell flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-sm text-[var(--muted)]">No QR token provided.</p>
        <Link href="/check-in" className="mt-4 text-xs underline text-[var(--muted)] hover:text-[var(--fg)]">go to check-in</Link>
      </main>
    )
  }

  if (status === "login") {
    return (
      <main className="pulse-shell flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-sm text-[var(--muted)] mb-4">Sign in to check in.</p>
        <Link
          href={`/login?next=${encodeURIComponent(`/check-in/scan?token=${token}`)}`}
          className="px-4 py-2 bg-[var(--fg)] text-[var(--bg)] text-xs font-medium"
        >
          sign in
        </Link>
      </main>
    )
  }

  if (status === "loading") {
    return (
      <main className="pulse-shell flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="pulse-skeleton h-8 w-48 mb-4" />
        <div className="pulse-skeleton h-4 w-32" />
      </main>
    )
  }

  if (status === "error") {
    return (
      <main className="pulse-shell flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-sm text-[var(--muted)] mb-2">QR code not recognized.</p>
        <p className="text-xs text-[var(--dim)]">This code may be invalid or the business hasn&apos;t been set up yet.</p>
        <Link href="/check-in" className="mt-4 text-xs underline text-[var(--muted)] hover:text-[var(--fg)]">go to check-in</Link>
      </main>
    )
  }

  return (
    <main className="pulse-shell flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="pulse-card p-8 max-w-sm w-full">
        <div className="text-3xl mb-3">&#10003;</div>
        <h1 className="text-lg font-bold mb-1">Checked in!</h1>
        <p className="text-sm text-[var(--muted)] mb-4">{businessName}</p>

        {isFirstVisit && (
          <div className="border border-[var(--post-volunteer)] p-3 mb-4 text-xs">
            <p className="font-bold text-[var(--post-volunteer)]">Reward unlocked</p>
            <p className="text-[var(--muted)] mt-1">10% off your first visit. Show this to the staff.</p>
          </div>
        )}

        <p className="text-xs text-[var(--dim)] mb-4">
          Visit #{visitCount} at {businessName}
        </p>

        <div className="flex gap-2 justify-center">
          <Link href="/check-in" className="text-xs text-[var(--muted)] hover:text-[var(--fg)]">
            check-in page
          </Link>
          <span className="text-[var(--dim)]">·</span>
          <Link href="/" className="text-xs text-[var(--muted)] hover:text-[var(--fg)]">
            home
          </Link>
        </div>
      </div>
    </main>
  )
}
