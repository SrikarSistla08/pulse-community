"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { uploadImage } from "@/lib/upload"
import { useCurrentUser, useSupabase } from "@/lib/supabase/hooks"
import { getProfileRole } from "@/lib/auth-client"
import { getBusinesses, getEvents, getOwnedBusinesses } from "@/lib/supabase/queries"
import type { Business, Event } from "@/types"
import { POST_TYPES, postTypeLabels } from "@/lib/posts"

export default function CreatePostForm() {
  const router = useRouter()
  const supabase = useSupabase()
  const user = useCurrentUser()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [type, setType] = useState("announcement")
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [businessId, setBusinessId] = useState("")
  const [eventId, setEventId] = useState("")
  const [accessLoaded, setAccessLoaded] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!supabase || !user) return
    let active = true

    Promise.all([
      getProfileRole(),
      getOwnedBusinesses(supabase, user.id),
      getBusinesses(supabase, user.id),
      getEvents(supabase),
    ]).then(([role, owned, all, fetchedEvents]) => {
      if (!active) return
      const manageable = role === "admin" ? all : role === "business" ? owned : []
      setBusinesses(manageable)
      setEvents(fetchedEvents)
      setBusinessId(manageable[0]?.id ?? "")
      setAccessLoaded(true)
    }).catch(() => {
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

    const needsEvent = type === "promotion" || type === "event"
    if (needsEvent && (!businessId || !eventId)) {
      setError("select a business and event for this promotion")
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

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        title,
        content,
        image_url: imageUrl,
        business_id: businessId || null,
        event_id: eventId || null,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.error ?? "could not create post")
      setSubmitting(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-5">
        / create post
      </h1>

      <form onSubmit={handleSubmit} className="border border-[var(--hr)] p-4 sm:p-6 space-y-4">
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">posting as</label>
          <select
            className="w-full text-sm"
            value={businessId}
            onChange={(e) => {
              setBusinessId(e.target.value)
              setEventId("")
            }}
            disabled={!accessLoaded}
          >
            <option value="">community member</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>{business.name}</option>
            ))}
          </select>
          {accessLoaded && businesses.length === 0 && (
            <p className="mt-1 text-[11px] text-[var(--dim)]">business promotion is available to business owners and admins.</p>
          )}
        </div>

        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">type</label>
          <select
            className="w-full text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {POST_TYPES.map((value) => <option key={value} value={value}>[{postTypeLabels[value]}]</option>)}
          </select>
        </div>

        {(type === "promotion" || type === "event") && (
          <div>
            <label className="text-xs text-[var(--muted)] block mb-1">promoted event</label>
            <select
              className="w-full text-sm"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              disabled={!businessId}
              required
            >
              <option value="">select an event</option>
              {events
                .filter((event) => event.businessId === businessId)
                .map((event) => (
                  <option key={event.id} value={event.id}>{event.title}</option>
                ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="what's happening?"
            className="w-full text-sm"
            required
          />
        </div>

        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="tell the community..."
            className="w-full text-sm h-32 resize-none"
            required
          />
        </div>

        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">image (optional)</label>
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
            disabled={submitting}
            className="border border-[var(--fg)] px-4 py-2 text-sm hover:bg-[var(--fg)] hover:text-[var(--bg)] disabled:opacity-50"
          >
            {submitting ? "[ publishing… ]" : "[ publish ]"}
          </button>
          <Link
            href="/"
            className="border border-[var(--hr)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--hr)]/20"
          >
            cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
