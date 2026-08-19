"use client"

import Link from "next/link"
import { Fragment, useState } from "react"
import { useSupabase } from "@/lib/supabase/hooks"
import { followBusiness, unfollowBusiness } from "@/lib/supabase/queries"
import PostCard from "@/components/post-card"
import EventCard from "@/components/event-card"
import QrCode from "@/components/qr-code"
import type { Business, Post, Event } from "@/types"
import BusinessImage from "@/components/business-image"
import { MapPin, Clock, Heart, Phone, Mail, Globe } from "lucide-react"

export default function BusinessDetailClient({
  business: initialBusiness,
  posts,
  events,
  userId,
}: {
  business: Business
  posts: Post[]
  events: Event[]
  userId: string | null
}) {
  const supabase = useSupabase()
  const [following, setFollowing] = useState(initialBusiness.isFollowing)
  const [followerCount, setFollowerCount] = useState(initialBusiness.followers)
  const business = { ...initialBusiness, followers: followerCount }

  async function toggleFollow() {
    const next = !following
    setFollowing(next)
    setFollowerCount((c) => c + (next ? 1 : -1))
    if (next) await followBusiness(supabase, userId, business.id)
    else await unfollowBusiness(supabase, userId, business.id)
  }

  const gallery =
    business.coverImage
      ? [business.coverImage, ...posts.slice(0, 2).map((p) => p.image).filter((x): x is string => Boolean(x))]
      : []

  return (
    <main className="pulse-shell">
      <Link
        href="/businesses"
        className="text-xs text-[var(--muted)] hover:underline"
      >
        &larr; back to businesses
      </Link>

      <div className="pulse-card mt-4 overflow-hidden">
        <BusinessImage name={business.name} category={business.category} logoUrl={business.logo} coverUrl={business.coverImage} variant="cover" className="h-28 w-full object-cover border-b border-[var(--hr)] sm:h-40 duotone" />
        <div className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <BusinessImage name={business.name} category={business.category} logoUrl={business.logo} className="-mt-10 h-14 w-14 shrink-0 object-cover duotone" />
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {business.name}
                {business.verified && (
                  <span
                    className="ml-1 text-[11px] align-middle"
                    style={{ color: "var(--post-announcement)" }}
                    title="verified business"
                  >
                    &#10003;
                  </span>
                )}
              </h1>
              <p className="text-xs text-[var(--muted)]">{business.category}</p>
              {business.tags && business.tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {business.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] border border-[var(--hr)] px-1.5 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {business.studentDiscount && (
                <p className="mt-1 text-xs text-[var(--muted)]">student discount available</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs mt-3">
            <button
              onClick={toggleFollow}
               className={`pulse-button ${
                following
                  ? "border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]"
                  : "border-[var(--fg)] hover:bg-[var(--fg)] hover:text-[var(--bg)]"
              }`}
            >
              {following ? "following" : "follow"}
            </button>
              <button className="pulse-button">
               share
             </button>
             <Link
               href={`/check-in?business=${business.id}`}
               className="pulse-button"
             >
               check in
             </Link>
          </div>

          {business.description && (
            <p className="text-sm sm:text-[15px] mt-3 leading-relaxed">{business.description}</p>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1 text-xs text-[var(--muted)]">
              {business.location && <div className="flex items-center gap-1.5"><MapPin size={12} strokeWidth={1.75} /> {business.location}</div>}
              {business.hours && <div className="flex items-center gap-1.5"><Clock size={12} strokeWidth={1.75} /> {business.hours}</div>}
              <div className="flex items-center gap-1.5 font-semibold text-[var(--fg)]"><Heart size={12} strokeWidth={1.75} /> {business.followers} followers</div>
            </div>

            {(business.phone || business.email || business.website) && (
              <div className="space-y-1 text-xs text-[var(--muted)]">
                {business.phone && <div className="flex items-center gap-1.5"><Phone size={12} strokeWidth={1.75} /> {business.phone}</div>}
                {business.email && <div className="flex items-center gap-1.5"><Mail size={12} strokeWidth={1.75} /> {business.email}</div>}
                {business.website && (
                  <div className="flex items-center gap-1.5">
                    <Globe size={12} strokeWidth={1.75} />{" "}
                    <a
                      href={business.website.startsWith("http") ? business.website : `https://${business.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--fg)] underline"
                    >
                      {business.website}
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="border border-[var(--hr)] p-1.5 shrink-0">
                <QrCode value={`${typeof window !== "undefined" ? window.location.origin : ""}/check-in/scan?token=${business.qrToken ?? business.id}`} size={64} />
              </div>
              <div className="text-[11px] text-[var(--muted)] leading-snug pt-0.5">
                scan this QR to check in
                <br />
                and unlock your reward
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="pulse-section">
        <div className="pulse-section-heading"><h2>happening here</h2></div>
        {events.length > 0 ? <div className="grid gap-3 sm:grid-cols-2">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <div className="pulse-empty text-sm">No events scheduled yet. Check back for what&apos;s next.</div>}
      </section>

      {gallery.length > 0 && (
        <>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mt-6 mb-3">
            / photos
          </h2>
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {gallery.map((src, i) => (
              <div key={i} className="duotone shrink-0">
                <img
                  src={src}
                  alt=""
                  className="h-20 w-28 object-cover border border-[var(--hr)]"
                />
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="pulse-kicker mt-10 mb-3">latest from this business</h2>

      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Fragment key={post.id}>
              <PostCard post={post} />
            </Fragment>
          ))
        ) : (
          <p className="pulse-empty text-sm">No posts yet. Updates from this business will appear here.</p>
        )}
      </div>
    </main>
  )
}
