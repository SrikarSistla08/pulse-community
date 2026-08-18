"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSupabase, useCurrentUser } from "@/lib/supabase/hooks"
import { getBusinesses, getPosts, getEvents, relativeTime } from "@/lib/supabase/queries"
import type { Business, Post, Event } from "@/types"
import L from "leaflet"
import BusinessImage from "@/components/business-image"
import "leaflet/dist/leaflet.css"

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

const filters: { key: FilterKey; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "◉" },
  { key: "open", label: "Open Now", icon: "●" },
  { key: "food", label: "Food", icon: "🍽" },
  { key: "coffee", label: "Coffee", icon: "☕" },
  { key: "event", label: "Events", icon: "🎉" },
  { key: "hiring", label: "Hiring", icon: "💼" },
  { key: "volunteer", label: "Volunteer", icon: "❤" },
  { key: "organization", label: "Orgs", icon: "🏛" },
  { key: "discount", label: "Deals", icon: "🎓" },
]

const CATEGORY_COLORS: Record<string, string> = {
  Restaurant: "#a03d2e",
  Cafe: "#8a6a1f",
  Books: "#2f6b66",
  Services: "#2f5f8f",
  Groceries: "#3f6b3a",
  Community: "#5b4b8a",
  default: "#6b5b4b",
}

const SEED_COORDS: Record<string, [number, number]> = {
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa": [39.2465, -76.6947],
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb": [39.2475, -76.6957],
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc": [39.2485, -76.6967],
  "dddddddd-dddd-4ddd-8ddd-dddddddddddd": [39.2455, -76.6937],
  "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee": [39.2495, -76.6927],
}

const ARBUTUS_CENTER: [number, number] = [39.2475, -76.6950]

const MAP_TYPES = [
  { key: "default", label: "Standard" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
] as const

function categoryColor(cat: string): string {
  for (const [k, v] of Object.entries(CATEGORY_COLORS)) {
    if (cat.includes(k)) return v
  }
  return CATEGORY_COLORS.default
}

function isOpenNow(hours: string | null): boolean | null {
  if (!hours) return null
  if (hours.toLowerCase().includes("24 hour")) return true
  const now = new Date()
  const m = now.getHours() * 60 + now.getMinutes()
  const range = hours.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i
  )
  if (!range) return null
  const toMin = (h: number, min: number, ampm: string) => {
    let hh = h % 12
    if (ampm.toLowerCase() === "pm") hh += 12
    return hh * 60 + min
  }
  const start = toMin(parseInt(range[1]), parseInt(range[2] ?? "0"), range[3])
  const end = toMin(parseInt(range[4]), parseInt(range[5] ?? "0"), range[6])
  return end > start ? m >= start && m < end : m >= start || m < end
}

function todayPromotion(posts: Post[], businessId: string): Post | undefined {
  return posts.find((p) => p.author.id === businessId && p.type === "promotion")
}

interface Spot {
  id: string
  type: "business" | "event" | "hiring" | "volunteer"
  lat: number
  lng: number
  title: string
  subtitle: string
  color: string
  businessId?: string
}

function buildSpots(businesses: Business[], posts: Post[], events: Event[]): Spot[] {
  const spots: Spot[] = []

  businesses.forEach((b) => {
    const coords = SEED_COORDS[b.id]
    if (!coords) return
    spots.push({
      id: `b-${b.id}`,
      type: "business",
      lat: coords[0],
      lng: coords[1],
      title: b.name,
      subtitle: b.category,
      color: categoryColor(b.category),
      businessId: b.id,
    })
  })

  events.forEach((e, i) => {
    const biz = businesses.find((b) => b.id === e.organizer.id)
    const coords = biz ? SEED_COORDS[biz.id] : null
    if (!coords) return
    spots.push({
      id: `e-${e.id}`,
      type: "event",
      lat: coords[0] + 0.0008 * Math.cos(i * 1.3),
      lng: coords[1] + 0.0008 * Math.sin(i * 1.3),
      title: e.title,
      subtitle: `${e.date} · ${e.time}`,
      color: "#a03d2e",
      businessId: biz?.id,
    })
  })

  posts
    .filter((p) => p.type === "hiring")
    .forEach((p, i) => {
      const biz = businesses.find((b) => b.id === p.author.id)
      const coords = biz ? SEED_COORDS[biz.id] : null
      if (!coords) return
      spots.push({
        id: `h-${p.id}`,
        type: "hiring",
        lat: coords[0] + 0.001 * Math.cos(i * 2.1 + 1),
        lng: coords[1] + 0.001 * Math.sin(i * 2.1 + 1),
        title: p.title,
        subtitle: `Hiring · ${p.author.name}`,
        color: "#2f6b66",
        businessId: biz?.id,
      })
    })

  posts
    .filter((p) => p.type === "volunteer")
    .forEach((p, i) => {
      const biz = businesses.find((b) => b.id === p.author.id)
      const coords = biz ? SEED_COORDS[biz.id] : null
      if (!coords) return
      spots.push({
        id: `v-${p.id}`,
        type: "volunteer",
        lat: coords[0] + 0.001 * Math.cos(i * 2.5 + 3),
        lng: coords[1] + 0.001 * Math.sin(i * 2.5 + 3),
        title: p.title,
        subtitle: `Volunteer · ${p.author.name}`,
        color: "#3f6b3a",
        businessId: biz?.id,
      })
    })

  return spots
}

const TILE_URLS: Record<string, string> = {
  default: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
}

export default function CommunityMap() {
  const supabase = useSupabase()
  const user = useCurrentUser()
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  const [filter, setFilter] = useState<FilterKey>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mapStyle, setMapStyle] = useState<"default" | "light" | "dark">("light")
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    return () => { active = false }
  }, [supabase, user])

  const spots = useMemo(() => buildSpots(businesses, posts, events), [businesses, posts, events])

  const visible = useMemo(() => {
    return spots.filter((s) => {
      if (filter === "all") return true
      const b = s.businessId ? businesses.find((x) => x.id === s.businessId) : null
      switch (filter) {
        case "open": return b ? isOpenNow(b.hours) === true : s.type === "event"
        case "food": return b?.category === "Restaurant" || b?.category === "Groceries" || false
        case "coffee": return b?.tags?.includes("coffee") ?? false
        case "event": return s.type === "event"
        case "hiring": return s.type === "hiring"
        case "volunteer": return s.type === "volunteer"
        case "organization": return b?.category === "Community"
        case "discount": return b?.studentDiscount ?? false
        default: return true
      }
    })
  }, [spots, filter, businesses])

  const selected = spots.find((s) => s.id === selectedId) ?? null
  const selectedBusiness = useMemo((): Business | null => {
    if (!selected?.businessId) return null
    return businesses.find((b) => b.id === selected.businessId) ?? null
  }, [selected, businesses])

  const panelPosts = selectedBusiness
    ? posts.filter((p) => p.author.id === selectedBusiness.id).slice(0, 3)
    : []
  const panelEvents = selectedBusiness
    ? events.filter((e) => e.organizer.id === selectedBusiness.id).slice(0, 2)
    : []
  const openStatus = selectedBusiness ? isOpenNow(selectedBusiness.hours) : null
  const promo = selectedBusiness ? todayPromotion(posts, selectedBusiness.id) : null

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return

    const map = L.map(mapRef.current!, {
      center: ARBUTUS_CENTER,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    })

    L.control.zoom({ position: "topright" }).addTo(map)
    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map)

    L.tileLayer(TILE_URLS.light, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
    }).addTo(map)

    leafletMap.current = map

    return () => {
      leafletMap.current?.remove()
      leafletMap.current = null
    }
  }, [])

  // Update markers when visible spots change
  useEffect(() => {
    const map = leafletMap.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    visible.forEach((spot) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:32px;height:32px;border-radius:50%;
          background:${spot.color};
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:14px;font-weight:bold;
          cursor:pointer;transition:transform 0.15s;
          ${selectedId === spot.id ? "transform:scale(1.3);box-shadow:0 0 0 3px " + spot.color + "88,0 4px 12px rgba(0,0,0,0.4);" : ""}
        ">${spot.type === "business" ? "📍" : spot.type === "event" ? "🎉" : spot.type === "hiring" ? "💼" : "❤"}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker([spot.lat, spot.lng], { icon })
        .addTo(map)
        .on("click", () => {
          setSelectedId(spot.id)
          setSidebarOpen(true)
          map.flyTo([spot.lat, spot.lng], 16, { duration: 0.8 })
        })

      markersRef.current.push(marker)
    })
  }, [visible, selectedId])

  // User location marker
  useEffect(() => {
    const map = leafletMap.current
    if (!map || !userLoc) return

    const icon = L.divIcon({
      className: "",
      html: `<div style="
        width:16px;height:16px;border-radius:50%;
        background:#1a1a1a;border:3px solid white;
        box-shadow:0 0 0 2px rgba(26,26,26,0.3),0 2px 6px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
    L.marker(userLoc, { icon }).addTo(map)
  }, [userLoc])

  // Switch tile layer
  useEffect(() => {
    const map = leafletMap.current
    if (!map) return

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) layer.remove()
    })

    L.tileLayer(TILE_URLS[mapStyle], {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
    }).addTo(map)
  }, [mapStyle])

  function locateUser() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserLoc(loc)
        leafletMap.current?.flyTo(loc, 15, { duration: 1 })
      },
      () => {}
    )
  }

  return (
    <div className="h-[calc(100dvh-120px)] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] mb-0.5">explore nearby</p>
        <h1 className="text-xl font-bold tracking-tight">Where it&apos;s happening.</h1>
      </div>

      {/* Filter bar */}
      <div className="px-4 pb-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <div className="flex gap-1.5 flex-1 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 border px-2.5 py-1 text-[11px] font-medium transition-all ${
                filter === f.key
                  ? "border-[var(--pulse-accent)] bg-[var(--pulse-accent)] text-white"
                  : "border-[var(--hr)] text-[var(--muted)] hover:border-[var(--fg)] hover:text-[var(--fg)]"
              }`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={locateUser}
            className="border border-[var(--hr)] p-1.5 text-xs hover:border-[var(--fg)] transition-colors"
            title="Find me"
          >
            ◎
          </button>
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value as typeof mapStyle)}
            className="border border-[var(--hr)] bg-[var(--bg)] text-[11px] px-1.5 py-1 appearance-none cursor-pointer"
          >
            {MAP_TYPES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="flex-1 relative overflow-hidden border-t border-[var(--hr)]">
        {/* Leaflet map */}
        <div ref={mapRef} className="absolute inset-0 z-0" />

        {/* Legend */}
        <div className="absolute top-2 left-2 z-[400] bg-[var(--bg)]/95 backdrop-blur-sm border border-[var(--hr)] px-2.5 py-1.5 text-[10px] text-[var(--dim)] shadow-sm">
          {visible.length} spot{visible.length !== 1 ? "s" : ""} · Arbutus, Vancouver
        </div>

        {/* Spot count badge */}
        {filter !== "all" && (
          <button
            onClick={() => setFilter("all")}
            className="absolute top-2 right-16 z-[400] bg-[var(--pulse-accent)] text-white text-[10px] font-bold px-2 py-1 shadow-md hover:opacity-90 transition-opacity"
          >
            clear filter
          </button>
        )}

        {/* Detail sidebar */}
        {selected && (
          <div
            className={`absolute top-0 right-0 h-full w-full max-w-sm bg-[var(--bg)] border-l border-[var(--hr)] shadow-2xl z-[500] overflow-y-auto transition-transform duration-300 ${
              sidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-[var(--hr)] bg-[var(--bg)]/95 backdrop-blur-sm z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                {selected.type}
              </span>
              <button
                onClick={() => { setSelectedId(null); setSidebarOpen(false) }}
                className="text-[var(--muted)] hover:text-[var(--fg)] text-lg leading-none transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              {selectedBusiness ? (
                <>
                  <div className="flex items-start gap-3">
                    <BusinessImage
                      name={selectedBusiness.name}
                      category={selectedBusiness.category}
                      logoUrl={selectedBusiness.logo}
                      className="h-12 w-12 shrink-0 object-cover rounded-md"
                    />
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold leading-tight">
                        {selectedBusiness.name}
                        {selectedBusiness.verified && (
                          <span className="ml-1 text-[10px] text-[var(--post-announcement)]">✓ verified</span>
                        )}
                      </h2>
                      <p className="text-[11px] text-[var(--muted)]">{selectedBusiness.category}</p>
                      <p className="text-[11px] text-[var(--muted)]">📍 {selectedBusiness.location}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-[11px]">
                    {openStatus !== null && (
                      <span className={openStatus ? "text-[var(--post-volunteer)]" : "text-[var(--post-event)]"}>
                        {openStatus ? "● open now" : "● closed"}
                      </span>
                    )}
                    <span className="text-[var(--dim)]">{selectedBusiness.hours}</span>
                  </div>

                  {selectedBusiness.studentDiscount && (
                    <div className="mt-2 text-[11px] text-[var(--post-hiring)] bg-[var(--post-hiring)]/10 px-2 py-1 inline-block">
                      🎓 student discount
                    </div>
                  )}

                  {promo && (
                    <div className="mt-3 border border-dashed border-[var(--pulse-accent)] bg-[var(--pulse-accent)]/5 p-3 rounded-md">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-accent)]">
                        today&apos;s deal
                      </div>
                      <p className="text-xs mt-1 font-medium">{promo.title}</p>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">{promo.content}</p>
                    </div>
                  )}

                  {panelEvents.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                        upcoming events
                      </h3>
                      <div className="space-y-2">
                        {panelEvents.map((e) => (
                          <Link
                            key={e.id}
                            href={`/events/${e.id}`}
                            className="block border border-[var(--hr)] p-2.5 hover:border-[var(--fg)] transition-colors no-underline"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">🎉</span>
                              <div>
                                <span className="text-xs font-bold text-[var(--fg)]">{e.title}</span>
                                <span className="text-[11px] text-[var(--muted)] block">{e.date} · {e.time}</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {panelPosts.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                        recent posts
                      </h3>
                      <div className="space-y-2">
                        {panelPosts.map((p) => (
                          <Link
                            key={p.id}
                            href={`/posts/${p.id}`}
                            className="block border border-[var(--hr)] p-2.5 hover:border-[var(--fg)] transition-colors no-underline"
                          >
                            <p className="text-xs font-medium text-[var(--fg)]">{p.title}</p>
                            <p className="text-[10px] text-[var(--dim)] mt-0.5">{relativeTime(p.createdAt)}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 space-y-2">
                    <Link
                      href={`/check-in?business=${selectedBusiness.id}`}
                      className="block w-full bg-[var(--pulse-accent)] text-white px-3 py-2.5 text-xs text-center font-medium no-underline hover:opacity-90 transition-opacity rounded-md"
                    >
                      📱 QR Check-in
                    </Link>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBusiness.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-[var(--hr)] px-3 py-2 text-xs text-center text-[var(--fg)] no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors rounded-md"
                      >
                        directions
                      </a>
                      <Link
                        href={`/businesses/${selectedBusiness.id}`}
                        className="border border-[var(--hr)] px-3 py-2 text-xs text-center text-[var(--fg)] no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors rounded-md"
                      >
                        view profile
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="text-2xl mb-2">{selected.type === "event" ? "🎉" : selected.type === "hiring" ? "💼" : "❤"}</div>
                  <h2 className="text-sm font-bold leading-tight">{selected.title}</h2>
                  <p className="text-[11px] text-[var(--muted)] mt-1">{selected.subtitle}</p>
                  <p className="text-xs text-[var(--dim)] mt-3">
                    {selected.type === "event"
                      ? "This event is hosted at this location. Tap the business for full details."
                      : "More details available on the business profile."}
                  </p>
                  {selected?.businessId && (
                    <Link
                      href={`/businesses/${selected.businessId}`}
                      className="mt-3 block border border-[var(--hr)] px-3 py-2 text-xs text-center text-[var(--fg)] no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors rounded-md"
                    >
                      view business
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
