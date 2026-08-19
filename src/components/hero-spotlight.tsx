import Link from "next/link"
import type { Event, Business, Post } from "@/types"
import BusinessImage from "@/components/business-image"
import { Flame, MapPin, PenLine, Globe } from "lucide-react"

interface HeroSpotlightProps {
  events: Event[]
  businesses: Business[]
  posts: Post[]
}

export default function HeroSpotlight({ events, businesses, posts }: HeroSpotlightProps) {
  const spotlight = events[0] ?? null
  const topBusinesses = businesses.slice(0, 4)

  return (
    <section className="mb-6">
      {/* Editorial hero */}
      <div className="grid gap-0 lg:grid-cols-[1fr_20rem] border border-[var(--hr)]">
        {/* Main feature */}
        <div className="border-b lg:border-b-0 lg:border-r border-[var(--hr)]">
          {spotlight ? (
            <Link href={`/events/${spotlight.id}`} className="flex flex-col h-full no-underline group">
              {spotlight.image && (
                <div className="duotone border-b border-[var(--hr)] overflow-hidden">
                  <img
                    src={spotlight.image}
                    alt={spotlight.title}
                    className="w-full h-48 sm:h-64 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              )}
              <div className="p-5 sm:p-7">
                <div className="newspaper-label mb-3">happening now</div>
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-[0.95] tracking-tight mb-3">
                  {spotlight.title}
                </h1>
                <p className="text-sm text-[var(--muted)] leading-relaxed max-w-lg mb-4">
                  {spotlight.description}
                </p>
                <div className="flex items-center gap-4 text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--muted)]">
                  <span>{spotlight.time}</span>
                  <span className="text-[var(--hr)]">|</span>
                  <span>{spotlight.location}</span>
                  <span className="text-[var(--hr)]">|</span>
                  <span>{spotlight.category}</span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
              <div className="newspaper-label mb-4">the local pulse</div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-[0.95] tracking-tight mb-3">
                What&apos;s happening<br />in Arbutus.
              </h1>
              <p className="text-sm text-[var(--muted)] max-w-md leading-relaxed">
                Community events, local businesses, and the energy that makes this neighborhood worth showing up for.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar: stats + actions */}
        <div className="flex flex-col">
          {/* Market watch / community stats */}
          <div className="p-5 border-b border-[var(--hr)]">
            <h2 className="font-mono text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--fg)] border-b border-[var(--fg)] pb-2 mb-3">
              Community Pulse
            </h2>
            <div className="space-y-3">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-[var(--muted)]">Local Businesses</span>
                <div className="text-right">
                  <span className="font-bold font-serif text-lg">{businesses.length}</span>
                  <span className="text-[10px] text-[var(--pulse-accent)] ml-1">active</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-[var(--muted)]">Upcoming Events</span>
                <div className="text-right">
                  <span className="font-bold font-serif text-lg">{events.length}</span>
                  <span className="text-[10px] text-[var(--pulse-accent)] ml-1">this week</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-[var(--muted)]">Community Posts</span>
                <div className="text-right">
                  <span className="font-bold font-serif text-lg">{posts.length}</span>
                  <span className="text-[10px] text-[var(--pulse-accent)] ml-1">latest</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-col flex-1">
            <Link
              href="/check-in"
              className="flex items-center gap-3 p-4 border-b border-[var(--hr)] no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] group transition-colors"
            >
              <MapPin size={16} strokeWidth={1.75} className="shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold block leading-tight">Check in nearby</span>
                <span className="text-[10px] text-[var(--muted)] group-hover:text-[var(--bg)]/60">Scan a QR, unlock a reward</span>
              </div>
            </Link>
            <Link
              href="/map"
              className="flex items-center gap-3 p-4 border-b border-[var(--hr)] no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] group transition-colors"
            >
              <Globe size={16} strokeWidth={1.75} className="shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold block leading-tight">Explore the map</span>
                <span className="text-[10px] text-[var(--muted)] group-hover:text-[var(--bg)]/60">{businesses.length} spots in Arbutus</span>
              </div>
            </Link>
            <Link
              href="/create/post"
              className="flex items-center gap-3 p-4 no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] group transition-colors"
            >
              <PenLine size={16} strokeWidth={1.75} className="shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold block leading-tight">Post something</span>
                <span className="text-[10px] text-[var(--muted)] group-hover:text-[var(--bg)]/60">Share an update or promotion</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Business strip */}
      {topBusinesses.length > 0 && (
        <div className="mt-0 border border-[var(--hr)] border-t-0 flex overflow-x-auto no-scrollbar">
          {topBusinesses.map((biz, i) => (
            <Link
              key={biz.id}
              href={`/businesses/${biz.id}`}
              className={`flex items-center gap-2.5 px-4 py-2.5 no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] group transition-colors shrink-0 ${
                i < topBusinesses.length - 1 ? "border-r border-[var(--hr)]" : ""
              }`}
            >
              <BusinessImage
                name={biz.name}
                category={biz.category}
                logoUrl={biz.logo}
                coverUrl={biz.coverImage}
                variant="logo"
                className="w-6 h-6 object-cover duotone"
              />
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase whitespace-nowrap">{biz.name}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
