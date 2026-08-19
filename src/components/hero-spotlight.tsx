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
    <section className="mb-10">
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem] items-stretch">
        {/* Editorial spotlight */}
        <div className="relative overflow-hidden border border-[var(--hr)] bg-[var(--surface)] flex flex-col" style={{ borderRadius: "var(--radius-md)" }}>
          {spotlight ? (
            <Link href={`/events/${spotlight.id}`} className="flex flex-col h-full no-underline group">
              {spotlight.image ? (
                <div className="duotone h-44 sm:h-52 overflow-hidden shrink-0">
                  <img
                    src={spotlight.image}
                    alt={spotlight.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="h-44 sm:h-52 bg-[var(--surface-muted)] shrink-0" />
              )}
              <div className="p-5 sm:p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-accent)]">
                    <Flame size={11} strokeWidth={2} /> happening now
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
                    {spotlight.time} &middot; {spotlight.location}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight mb-1">
                  {spotlight.title}
                </h2>
                <p className="text-sm text-[var(--muted)] line-clamp-2 mb-3">
                  {spotlight.description}
                </p>
                <span className="mt-auto text-xs font-semibold uppercase tracking-wider text-[var(--pulse-accent)] group-hover:underline">
                  See what&apos;s happening &rarr;
                </span>
              </div>
            </Link>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 sm:p-10 text-center">
              <p className="pulse-kicker mb-2">the local pulse</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                What&apos;s happening in Arbutus.
              </h2>
              <p className="text-sm text-[var(--muted)] max-w-md">
                Community events, local businesses, and the energy that makes this neighborhood worth showing up for.
              </p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/check-in"
            className="flex items-center gap-3 p-4 border border-[var(--hr)] bg-[var(--surface)] no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] group transition-colors"
            style={{ borderRadius: "var(--radius-md)" }}
          >
            <span className="flex items-center justify-center w-10 h-10 border border-[var(--hr)] group-hover:border-[var(--bg)]/30 shrink-0" style={{ borderRadius: "var(--radius-sm)" }}>
              <MapPin size={18} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <span className="text-sm font-bold block leading-tight">Check in nearby</span>
              <span className="text-[11px] text-[var(--muted)] group-hover:text-[var(--bg)]/60">Scan a QR, unlock a reward</span>
            </div>
          </Link>

          <Link
            href="/map"
            className="flex items-center gap-3 p-4 border border-[var(--hr)] bg-[var(--surface)] no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] group transition-colors"
            style={{ borderRadius: "var(--radius-md)" }}
          >
            <span className="flex items-center justify-center w-10 h-10 border border-[var(--hr)] group-hover:border-[var(--bg)]/30 shrink-0" style={{ borderRadius: "var(--radius-sm)" }}>
              <Globe size={18} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <span className="text-sm font-bold block leading-tight">Explore the map</span>
              <span className="text-[11px] text-[var(--muted)] group-hover:text-[var(--bg)]/60">{businesses.length} spots in Arbutus</span>
            </div>
          </Link>

          <Link
            href="/post/new"
            className="flex items-center gap-3 p-4 border border-[var(--hr)] bg-[var(--surface)] no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] group transition-colors"
            style={{ borderRadius: "var(--radius-md)" }}
          >
            <span className="flex items-center justify-center w-10 h-10 border border-[var(--hr)] group-hover:border-[var(--bg)]/30 shrink-0" style={{ borderRadius: "var(--radius-sm)" }}>
              <PenLine size={18} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <span className="text-sm font-bold block leading-tight">Post something</span>
              <span className="text-[11px] text-[var(--muted)] group-hover:text-[var(--bg)]/60">Share an event, update, or promotion</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Business strip — aligned under spotlight only */}
      {topBusinesses.length > 0 && (
        <div className="mt-4 lg:max-w-[calc(100%-19rem)] flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {topBusinesses.map((biz) => (
            <Link
              key={biz.id}
              href={`/businesses/${biz.id}`}
              className="flex items-center gap-2.5 px-3 py-2 border border-[var(--hr)] bg-[var(--surface)] no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] group transition-colors shrink-0"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              <BusinessImage
                name={biz.name}
                category={biz.category}
                logoUrl={biz.logo}
                coverUrl={biz.coverImage}
                variant="logo"
                className="w-7 h-7 rounded-sm object-cover duotone"
              />
              <span className="text-xs font-semibold whitespace-nowrap">{biz.name}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
