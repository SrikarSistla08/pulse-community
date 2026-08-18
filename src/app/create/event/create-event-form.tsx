"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { uploadImage } from "@/lib/upload"
import { useCurrentUser, useSupabase } from "@/lib/supabase/hooks"
import { getProfileRole } from "@/lib/auth-client"
import { getBusinesses, getOwnedBusinesses } from "@/lib/supabase/queries"
import type { Business } from "@/types"

export default function CreateEventForm() {
  const router = useRouter()
  const supabase = useSupabase()
  const user = useCurrentUser()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("Social")
  const [capacity, setCapacity] = useState("")
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [businessId, setBusinessId] = useState("")
  const [accessLoaded, setAccessLoaded] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!supabase || !user) return
    let active = true

    Promise.all([getProfileRole(), getOwnedBusinesses(supabase, user.id), getBusinesses(supabase, user.id)])
      .then(([role, owned, all]) => {
        if (!active) return
        const manageable = role === "admin" ? all : role === "business" ? owned : []
        setBusinesses(manageable)
        setBusinessId(manageable[0]?.id ?? "")
        setAccessLoaded(true)
      })
      .catch(() => {
        if (active) setAccessLoaded(true)
      })

    return () => {
      active = false
    }
  }, [supabase, user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    if (!businessId || !user) {
      setError("only a business owner or admin can publish a business event")
      setSubmitting(false)
      return
    }

    if (!date || !startTime || !endTime) {
      setError("event date, start time, and end time are required")
      setSubmitting(false)
      return
    }

    if (endTime <= startTime) {
      setError("End time must be later than start time.")
      setSubmitting(false)
      return
    }

    const startsAt = new Date(`${date}T${startTime}:00`)
    const endsAt = new Date(`${date}T${endTime}:00`)
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setError("Please enter a valid event date and time.")
      setSubmitting(false)
      return
    }

    let imageUrl: string | null = null
    if (image && user?.id) {
      try {
        imageUrl = await uploadImage(image, user.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : "could not upload image")
        setSubmitting(false)
        return
      }
    }

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          location,
          category,
          capacity: capacity ? Number(capacity) : null,
          business_id: businessId,
          image_url: imageUrl,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? "could not create event")
        setSubmitting(false)
        return
      }
    } catch {
      setError("could not reach the server. Please try again.")
      setSubmitting(false)
      return
    }

    router.push("/events")
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-5">
        / create event
      </h1>

      <form onSubmit={handleSubmit} className="border border-[var(--hr)] p-4 sm:p-6 space-y-4">
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">business</label>
          <select
            className="w-full text-sm"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            disabled={!accessLoaded || businesses.length === 0}
            required
          >
            {businesses.length === 0 ? (
              <option value="">no business access</option>
            ) : (
              businesses.map((business) => (
                <option key={business.id} value={business.id}>{business.name}</option>
              ))
            )}
          </select>
          {accessLoaded && businesses.length === 0 && (
            <p className="mt-1 text-[11px] text-[var(--post-event)]">a business owner or admin account is required.</p>
          )}
        </div>

        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="event name"
            className="w-full text-sm"
            required
          />
        </div>

        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="what's the event about?"
            className="w-full text-sm h-24 resize-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs text-[var(--muted)] block mb-1">event date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)] block mb-1">starts</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)] block mb-1">ends</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="venue name and address"
            className="w-full text-sm"
            required
          />
        </div>

        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">capacity (optional)</label>
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="maximum attendees"
            className="w-full text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">category</label>
          <select
            className="w-full text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Social</option>
            <option>Fitness</option>
            <option>Workshop</option>
            <option>Education</option>
            <option>Volunteer</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">cover image (optional)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </div>

        {error && (
          <p className="text-xs text-[var(--post-event)]">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || !accessLoaded || !businessId}
            className="border border-[var(--fg)] px-4 py-2 text-sm hover:bg-[var(--fg)] hover:text-[var(--bg)] disabled:opacity-50"
          >
            {submitting ? "[ publishing… ]" : "[ publish ]"}
          </button>
          <Link
            href="/events"
            className="border border-[var(--hr)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--hr)]/20"
          >
            cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
