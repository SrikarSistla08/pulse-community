"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { followBusiness, unfollowBusiness, rsvpEvent, unrsvpEvent } from "@/lib/supabase/queries"
import { useCurrentUser, useSupabase } from "@/lib/supabase/hooks"
import { useToast } from "@/components/toast"

interface EventActionsProps {
  eventId: string
  businessId?: string
  isFollowing: boolean
  isRsvped: boolean
  rsvpCount: number
  capacity?: number
}

export default function EventActions({ eventId, businessId, isFollowing, isRsvped, rsvpCount, capacity }: EventActionsProps) {
  const router = useRouter()
  const supabase = useSupabase()
  const user = useCurrentUser()
  const { toast } = useToast()
  const [following, setFollowing] = useState(isFollowing)
  const [rsvped, setRsvped] = useState(isRsvped)
  const [count, setCount] = useState(rsvpCount)

  async function toggleFollow() {
    if (!businessId) return
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/events/${eventId}`)}`)
      return
    }
    const next = !following
    setFollowing(next)
    if (next) {
      await followBusiness(supabase, user.id, businessId)
      toast(`Following ${businessId}`)
    } else {
      await unfollowBusiness(supabase, user.id, businessId)
      toast("Unfollowed")
    }
  }

  async function toggleRsvp() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/events/${eventId}`)}`)
      return
    }
    const next = !rsvped
    setRsvped(next)
    setCount(next ? count + 1 : count - 1)
    if (next) {
      await rsvpEvent(supabase, user.id, eventId)
      toast("You're going!")
    } else {
      await unrsvpEvent(supabase, user.id, eventId)
      toast("RSVP cancelled")
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={toggleRsvp}
        className={`pulse-button ${
          rsvped ? "pulse-button-primary" : "hover:bg-[var(--fg)] hover:text-[var(--bg)]"
        }`}
      >
        {rsvped ? "going ✓" : "rsvp"}
      </button>
      {count > 0 && (
        <span className="pulse-button pulse-button-quiet pointer-events-none">
          {count} {count === 1 ? "person" : "people"} going
        </span>
      )}
      {capacity && (
        <span className="pulse-button pulse-button-quiet pointer-events-none">
          {capacity} spots
        </span>
      )}
      {businessId && (
        <button
          onClick={toggleFollow}
          className={`pulse-button ${
            following ? "bg-[var(--fg)] text-[var(--bg)]" : "hover:bg-[var(--fg)] hover:text-[var(--bg)]"
          }`}
        >
          {following ? "following business" : "follow business"}
        </button>
      )}
      {businessId && (
        <Link
          href={`/check-in?business=${businessId}`}
          className="pulse-button"
        >
          check in
        </Link>
      )}
    </div>
  )
}
