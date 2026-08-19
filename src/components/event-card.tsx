"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useSupabase, useCurrentUser } from "@/lib/supabase/hooks"
import { rsvpEvent, unrsvpEvent } from "@/lib/supabase/queries"
import { useToast } from "@/components/toast"
import { Calendar, Clock, MapPin } from "lucide-react"
import type { Event } from "@/types"

export default function EventCard({ event }: { event: Event }) {
  const router = useRouter()
  const supabase = useSupabase()
  const user = useCurrentUser()
  const { toast } = useToast()
  const [rsvped, setRsvped] = useState(event.isRsvped)
  const [rsvpCount, setRsvpCount] = useState(event.rsvpCount)

  async function toggleRsvp() {
    if (!user || !supabase) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    const next = !rsvped
    setRsvped(next)
    setRsvpCount(next ? rsvpCount + 1 : rsvpCount - 1)
    if (next) {
      await rsvpEvent(supabase, user.id, event.id)
      toast("You're going!")
    } else {
      await unrsvpEvent(supabase, user.id, event.id)
      toast("RSVP cancelled")
    }
  }

  return (
    <article className="pulse-card overflow-hidden">
      {event.image && (
        <div className="border-b border-[var(--hr)] duotone">
          <img
            src={event.image}
            alt=""
            className="w-full h-32 object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="text-xs text-[var(--muted)] mb-1">
          {event.category} &mdash; {event.organizer.name}
        </div>

        <h3 className="mb-2 text-lg font-bold leading-tight tracking-tight">
          <Link href={`/events/${event.id}`} className="hover:underline">
            {event.title}
          </Link>
        </h3>

        <div className="mb-3 space-y-1 text-xs text-[var(--fg)]">
          <div className="flex items-center gap-1.5"><Calendar size={12} strokeWidth={1.75} /> {event.date}</div>
          <div className="flex items-center gap-1.5"><Clock size={12} strokeWidth={1.75} /> {event.time}</div>
          <div className="flex items-center gap-1.5"><MapPin size={12} strokeWidth={1.75} /> {event.location}</div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={toggleRsvp}
            className={`text-[10px] border px-2 py-0.5 ${
              rsvped
                ? "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]"
                : "border-[var(--hr)] hover:border-[var(--fg)]"
            }`}
          >
            {rsvped ? "going ✓" : "+ rsvp"}
          </button>
          {rsvpCount > 0 && (
            <span className="text-[10px] text-[var(--muted)]">
              {rsvpCount} {rsvpCount === 1 ? "person" : "people"} going
            </span>
          )}
          {event.capacity && (
            <span className="text-[10px] text-[var(--dim)]">
              {event.capacity} spots
            </span>
          )}
          <Link
            href={`/events/${event.id}`}
            className="text-[10px] text-[var(--muted)] hover:underline ml-auto"
          >
            details →
          </Link>
        </div>
      </div>
    </article>
  )
}
