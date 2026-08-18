"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSupabase, useCurrentUser } from "@/lib/supabase/hooks"
import { getBusinesses, getPosts, getEvents, relativeTime } from "@/lib/supabase/queries"
import type { Business, Post, Event } from "@/types"
import BusinessImage from "@/components/business-image"

type SpotKind = "business" | "event" | "hiring" | "volunteer" | "university"
type FilterKey =
  | "all"
  | "open"
  | "food"
  | "coffee"
  | "event"
  | "hiring"
  | "volunteer"
  | "organization"
  | "discount"

interface MapSpot {
  id: string
  kind: SpotKind
  x: number
  y: number
  businessId?: string
  title: string
  subtitle: string
  icon: string
  ring: string
  distMi: number
}

const VIEW = { w: 800, h: 600 }
const YOU = { x: 390, y: 390 }

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open Now" },
  { key: "food", label: "Food" },
  { key: "coffee", label: "Coffee" },
  { key: "event", label: "Events" },
  { key: "hiring", label: "Hiring" },
  { key: "volunteer", label: "Volunteer" },
  { key: "organization", label: "Organizations" },
  { key: "discount", label: "Student Discounts" },
]

const COLORS = {
  coffee: "#8a6a1f",
  food: "#a03d2e",
  gym: "#2f5f8f",
  retail: "#2f6b66",
  event: "#a03d2e",
  hiring: "#2f6b66",
  volunteer: "#3f6b3a",
  organization: "#5b4b8a",
  university: "#b8b5ae",
}

function businessEmoji(b: Business): string {
  if (b.tags?.includes("Coffee")) return "☕"
  if (b.category === "Fitness" || b.category.includes("Gym")) return "🏋"
  if (b.category.includes("Retail") || b.category === "Services") return "🛍"
  if (b.category === "Community") return "🏛"
  return "🍕"
}

function businessRing(b: Business): string {
  if (b.tags?.includes("Coffee")) return COLORS.coffee
  if (b.category === "Fitness" || b.category.includes("Gym")) return COLORS.gym
  if (b.category.includes("Retail") || b.category === "Services") return COLORS.retail
  if (b.category === "Community") return COLORS.organization
  return COLORS.food
}

const FIXED_POSITIONS = [
  { x: 230, y: 150 },
  { x: 560, y: 205 },
  { x: 395, y: 330 },
  { x: 632, y: 405 },
  { x: 475, y: 245 },
  { x: 305, y: 445 },
]

function positionFor(index: number): { x: number; y: number } {
  return FIXED_POSITIONS[index % FIXED_POSITIONS.length] ?? { x: 400, y: 300 }
}

function distTo(x: number, y: number): number {
  const d = Math.sqrt((x - YOU.x) ** 2 + (y - YOU.y) ** 2)
  return Math.max(0.1, Math.round(d * 0.004 * 10) / 10)
}

function buildSpots(
  businesses: Business[],
  posts: Post[],
  events: Event[]
): MapSpot[] {
  const spots: MapSpot[] = []

  businesses.forEach((b, i) => {
    const pos = positionFor(i)
    spots.push({
      id: `b-${b.id}`,
      kind: "business",
      x: pos.x,
      y: pos.y,
      businessId: b.id,
      title: b.name,
      subtitle: b.category,
      icon: businessEmoji(b),
      ring: businessRing(b),
      distMi: distTo(pos.x, pos.y),
    })
  })

  events.forEach((e) => {
    const pos = FIXED_POSITIONS[Math.max(0, businesses.findIndex((b) => b.id === e.organizer.id))] ?? { x: 400, y: 300 }
    spots.push({
      id: `e-${e.id}`,
      kind: "event",
      x: pos.x + 40,
      y: pos.y - 34,
      businessId: e.organizer.id,
      title: e.title,
      subtitle: `Event · ${e.date}`,
      icon: "🎉",
      ring: COLORS.event,
      distMi: distTo(pos.x + 40, pos.y - 34),
    })
  })

  posts
    .filter((p) => p.type === "hiring")
    .forEach((p) => {
      const pos = FIXED_POSITIONS[Math.max(0, businesses.findIndex((b) => b.id === p.author.id))] ?? { x: 400, y: 300 }
      spots.push({
        id: `h-${p.id}`,
        kind: "hiring",
        x: pos.x - 40,
        y: pos.y + 30,
        businessId: p.author.id,
        title: p.title,
        subtitle: `Hiring · ${p.author.name}`,
        icon: "💼",
        ring: COLORS.hiring,
        distMi: distTo(pos.x - 40, pos.y + 30),
      })
    })

  posts
    .filter((p) => p.type === "volunteer")
    .forEach((p) => {
      const pos = FIXED_POSITIONS[Math.max(0, businesses.findIndex((b) => b.id === p.author.id))] ?? { x: 400, y: 300 }
      spots.push({
        id: `v-${p.id}`,
        kind: "volunteer",
        x: pos.x + 10,
        y: pos.y + 58,
        businessId: p.author.id,
        title: p.title,
        subtitle: `Volunteer · ${p.author.name}`,
        icon: "❤️",
        ring: COLORS.volunteer,
        distMi: distTo(pos.x + 10, pos.y + 58),
      })
    })

  spots.push({
    id: "u-umbc",
    kind: "university",
    x: 700,
    y: 90,
    title: "UMBC Campus",
    subtitle: "University · coming soon",
    icon: "🎓",
    ring: COLORS.university,
    distMi: distTo(700, 90),
  })

  return spots
}

function isOpenNow(hours: string): boolean | null {
  if (hours === "Open 24 hours") return true
  if (hours === "By event") return null
  const now = new Date()
  const m = now.getHours() * 60 + now.getMinutes()
  const blocks = hours.split(",").map((s) => s.trim())
  const range = blocks[blocks.length - 1].match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*–\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i
  )
  if (!range) return null
  const toMin = (h: number, min: number, ampm: string) => {
    let hh = h % 12
    if (ampm.toLowerCase() === "pm") hh += 12
    return hh * 60 + min
  }
  const start = toMin(parseInt(range[1]), parseInt(range[2] ?? "0"), range[3])
  const end = toMin(parseInt(range[4]), parseInt(range[5] ?? "0"), range[6])
  if (end > start) return m >= start && m < end
  return m >= start || m < end
}

function todayPromotion(posts: Post[], businessId: string): Post | undefined {
  return posts.find((p) => p.author.id === businessId && p.type === "promotion")
}

export default function CommunityMap() {
  const supabase = useSupabase()
  const user = useCurrentUser()
  const [filter, setFilter] = useState<FilterKey>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    if (!supabase) return
    let active = true
    Promise.all([
      getBusinesses(supabase, user?.id ?? null),
      getPosts(supabase, user?.id ?? null),
      getEvents(supabase),
    ]).then(([biz, p, ev]) => {
      if (active) {
        setBusinesses(biz)
        setPosts(p)
        setEvents(ev)
      }
    })
    return () => {
      active = false
    }
  }, [supabase, user])

  const spots = useMemo(() => buildSpots(businesses, posts, events), [businesses, posts, events])
  const selected = spots.find((s) => s.id === selectedId) ?? null

  const business: Business | null = selected?.businessId
    ? businesses.find((b) => b.id === selected!.businessId) ?? null
    : null

  const visible = spots.filter((s) => {
    if (filter === "all") return true
    const b = s.businessId ? businesses.find((x) => x.id === s.businessId) : null
    switch (filter) {
      case "open":
        return b ? isOpenNow(b.hours) === true : s.kind === "event"
      case "food":
        return b ? b.category === "Food & Drink" || b.category === "Bar" : false
      case "coffee":
        return b?.tags?.includes("Coffee") ?? false
      case "event":
        return s.kind === "event"
      case "hiring":
        return s.kind === "hiring"
      case "volunteer":
        return s.kind === "volunteer"
      case "organization":
        return b?.category === "Community" || s.kind === "university"
      case "discount":
        return b?.studentDiscount ?? false
    }
  })

  const panelPosts = business ? posts.filter((p) => p.author.id === business.id).slice(0, 3) : []
  const panelEvents = business
    ? events.filter((e) => e.organizer.id === business.id).slice(0, 2)
    : []
  const openStatus = business ? isOpenNow(business.hours) : null
  const promo = business ? todayPromotion(posts, business.id) : null

  return (
    <main className="pulse-shell">
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
        <div><p className="pulse-kicker">explore nearby</p><h1 className="pulse-title">Where it&apos;s happening.</h1></div>
        <p className="text-xs text-[var(--dim)]">what is happening around me right now?</p>
      </div>

      <div className="flex flex-wrap gap-1.5 my-4">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`border px-2.5 py-1 text-xs ${
              filter === f.key
                ? "border-[var(--pulse-accent)] bg-[var(--pulse-accent)] text-[var(--bg)]"
                : "border-[var(--hr)] hover:border-[var(--fg)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-md border border-[var(--hr)] bg-[var(--bg)]">
        <svg
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          className="w-full h-auto block"
          aria-label="community map of arbutus"
        >
          <rect width={VIEW.w} height={VIEW.h} fill="var(--bg)" />

          <g fill="#ece8df">
            <rect x="70" y="70" width="170" height="150" rx="26" />
            <rect x="410" y="240" width="170" height="135" rx="24" />
            <rect x="60" y="370" width="150" height="120" rx="24" />
            <rect x="580" y="370" width="160" height="140" rx="24" />
            <rect x="590" y="120" width="150" height="120" rx="24" />
          </g>

          <g rx="30">
            <rect x="120" y="360" width="230" height="150" rx="30" fill="#e3e8da" stroke="#cdd5c2" strokeWidth="1" />
          </g>
          <text x="235" y="452" fontSize="12" fill="#93a184" textAnchor="middle" fontFamily="Courier, monospace">
            Arbutus Park
          </text>

          <rect x="740" y="470" width="80" height="140" rx="30" fill="#e2edf0" />
          <text x="742" y="570" fontSize="11" fill="#9db8bf" fontFamily="Courier, monospace" transform="rotate(-90 742 570)">
            Patapsco
          </text>

          <g stroke="#d9d4c8" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M 40 210 Q 300 155 800 90" />
            <path d="M 255 600 Q 330 380 450 20" />
            <path d="M -10 400 Q 340 430 810 360" />
            <path d="M 130 -10 Q 150 250 90 610" />
            <path d="M 640 -10 Q 660 300 700 610" />
          </g>

          <g stroke="#e2ded3" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <path d="M 210 10 Q 230 170 190 400" />
            <path d="M 520 10 Q 500 220 540 600" />
          </g>

          <text x="525" y="120" fontSize="11" fill="#b3ac9d" fontFamily="Courier, monospace">
            Sulphur Spring Rd
          </text>
          <text x="268" y="330" fontSize="11" fill="#b3ac9d" fontFamily="Courier, monospace" transform="rotate(68 268 330)">
            Leeds Ave
          </text>
          <text x="150" y="368" fontSize="11" fill="#b3ac9d" fontFamily="Courier, monospace">
            Benson Ave
          </text>

          <g>
            <circle cx={16} cy={VIEW.h - 16} r={10} fill="none" stroke="#b3ac9d" strokeWidth="1" />
            <path d="M 16 12 L 19 21 L 16 19 L 13 21 Z" fill="#b3ac9d" />
            <text x={16} y={VIEW.h - 1} fontSize="9" fill="#b3ac9d" textAnchor="middle" fontFamily="Courier, monospace">
              N
            </text>
          </g>
        </svg>

        <span
          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
          style={{ left: `${(YOU.x / VIEW.w) * 100}%`, top: `${(YOU.y / VIEW.h) * 100}%` }}
        >
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--fg)] opacity-30" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[var(--fg)] border border-[var(--bg)]" />
          </span>
        </span>

        {visible.map((spot) => {
          const left = (spot.x / VIEW.w) * 100
          const top = (spot.y / VIEW.h) * 100
          const isSel = selectedId === spot.id
          return (
            <button
              key={spot.id}
              onClick={() => setSelectedId(isSel ? null : spot.id)}
              title={spot.title}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20 transition-transform hover:scale-110"
              style={{ left: `${left}%`, top: `${top}%`, zIndex: isSel ? 30 : 20 }}
            >
              <span
                className={`block rounded-full bg-[var(--bg)] shadow-md flex items-center justify-center border transition-all ${
                  isSel ? "w-11 h-11 text-lg" : "w-9 h-9 text-base"
                }`}
                style={{
                  borderColor: spot.ring,
                  boxShadow: isSel ? `0 0 0 3px ${spot.ring}55, 0 6px 16px rgba(0,0,0,0.18)` : undefined,
                }}
              >
                {spot.icon}
              </span>
              {isSel && (
                <span className="mt-1 block text-center text-[10px] font-bold whitespace-nowrap bg-[var(--bg)] px-1.5 py-0.5 border border-[var(--hr)] shadow-sm">
                  {spot.title}
                </span>
              )}
            </button>
          )
        })}

        <div className="absolute bottom-2 left-2 text-[10px] text-[var(--dim)] bg-[var(--bg)]/85 px-1.5 py-0.5 border border-[var(--hr)]">
          community pulse heatmap — coming in version 2
        </div>
      </div>

      {selected && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-[var(--hr)] bg-[var(--bg)] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-[var(--hr)] bg-[var(--bg)]/95 backdrop-blur-sm z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              / {selected.kind === "business" ? "business" : selected.subtitle}
            </span>
            <button
              onClick={() => setSelectedId(null)}
              className="text-xs border border-[var(--hr)] px-2 py-0.5 hover:border-[var(--fg)]"
            >
              [ x ]
            </button>
          </div>

          <div className="p-4">
            {selected.kind !== "business" && (
              <div className="mb-4 border border-[var(--fg)] p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selected.icon}</span>
                  <div>
                    <div className="text-sm font-bold leading-tight">{selected.title}</div>
                    <div className="text-[11px] text-[var(--muted)]">{selected.subtitle}</div>
                  </div>
                </div>
              </div>
            )}

            {business ? (
              <>
                <div className="flex items-start gap-3">
                  <BusinessImage name={business.name} category={business.category} logoUrl={business.logo} className="h-12 w-12 shrink-0 object-cover duotone" />
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold leading-tight">
                      {business.name}
                      {business.verified && (
                        <span className="text-[10px] text-[var(--post-announcement)]"> ✓</span>
                      )}
                    </h2>
                    <p className="text-[11px] text-[var(--muted)]">{business.category}</p>
                    <p className="text-[11px] text-[var(--muted)]">&#9906; {business.location}</p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-3 text-[11px]">
                  <span className="text-[var(--dim)]">&#9878; {selected.distMi} mi</span>
                </div>

                <div className="mt-1.5 text-[11px]">
                  {openStatus === null ? (
                    <span className="text-[var(--dim)]">by appointment / event</span>
                  ) : openStatus ? (
                    <span className="text-[var(--post-volunteer)]">● open now</span>
                  ) : (
                    <span className="text-[var(--post-event)]">● closed now</span>
                  )}
                  <span className="text-[var(--muted)]"> · {business.hours}</span>
                </div>

                {business.studentDiscount && (
                  <div className="mt-1.5 text-[11px] text-[var(--post-hiring)]">
                    🎓 student discount available
                  </div>
                )}

                {promo && (
                  <div className="mt-3 border border-dashed border-[var(--fg)] p-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--post-promotion)]">
                      today&apos;s promotion
                    </div>
                    <p className="text-xs mt-1">{promo.title}</p>
                    <p className="text-[11px] text-[var(--muted)] mt-0.5">{promo.content}</p>
                  </div>
                )}

                {panelEvents.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">
                      upcoming events
                    </h3>
                    <ul className="space-y-1.5 text-xs">
                      {panelEvents.map((e) => (
                        <li key={e.id} className="flex gap-2">
                          <span className="text-[var(--post-event)]">🎉</span>
                          <span>
                            <span className="font-bold">{e.title}</span>
                            <span className="text-[var(--muted)]"> · {e.date} · {e.time}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {panelPosts.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">
                      recent posts
                    </h3>
                    <ul className="space-y-1.5 text-xs">
                      {panelPosts.map((p) => (
                        <li key={p.id}>
                          <span className="text-[var(--muted)]">{relativeTime(p.createdAt)}</span> — {p.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 space-y-1.5">
                  <Link
                    href={`/check-in?business=${business.id}`}
                    className="block w-full border border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] px-3 py-2 text-xs text-center no-underline hover:opacity-90"
                  >
                    &#128241; QR check-in
                  </Link>
                  <div className="grid grid-cols-2 gap-1.5">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        "Arbutus, MD " + business.location
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-[var(--fg)] px-3 py-1.5 text-xs text-center hover:bg-[var(--fg)] hover:text-[var(--bg)]"
                    >
                      directions
                    </a>
                    <Link
                      href={`/businesses/${business.id}`}
                      className="border border-[var(--fg)] px-3 py-1.5 text-xs text-center no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)]"
                    >
                      view profile
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <h2 className="text-sm font-bold leading-tight">{selected.title}</h2>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">{selected.subtitle}</p>
                <p className="text-xs text-[var(--dim)] mt-3">
                  {selected.kind === "university"
                    ? "University locations are coming in a future version."
                    : "More details coming soon."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
