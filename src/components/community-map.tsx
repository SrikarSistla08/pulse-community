"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSupabase, useCurrentUser } from "@/lib/supabase/hooks"
import { getBusinesses, getPosts, getEvents, relativeTime } from "@/lib/supabase/queries"
import type { Business, Post, Event } from "@/types"
import L from "leaflet"
import BusinessImage from "@/components/business-image"
import {
  MapPin, CalendarDays, Briefcase, Heart, Search, X,
  UtensilsCrossed, Coffee, PartyPopper, GraduationCap, Building2,
  Crosshair, Navigation
} from "lucide-react"
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

const filters: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <Search size={11} strokeWidth={2} /> },
  { key: "open", label: "Open Now", icon: <span className="inline-block w-2 h-2 rounded-full bg-[var(--post-volunteer)]" /> },
  { key: "food", label: "Food", icon: <UtensilsCrossed size={11} strokeWidth={2} /> },
  { key: "coffee", label: "Coffee", icon: <Coffee size={11} strokeWidth={2} /> },
  { key: "event", label: "Events", icon: <PartyPopper size={11} strokeWidth={2} /> },
  { key: "hiring", label: "Hiring", icon: <Briefcase size={11} strokeWidth={2} /> },
  { key: "volunteer", label: "Volunteer", icon: <Heart size={11} strokeWidth={2} /> },
  { key: "organization", label: "Orgs", icon: <Building2 size={11} strokeWidth={2} /> },
  { key: "discount", label: "Deals", icon: <GraduationCap size={11} strokeWidth={2} /> },
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

const ARBUTUS_CENTER: [number, number] = [39.2475, -76.6950]

const BUSINESS_POSITIONS: Record<string, [number, number]> = {
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa": [39.2468, -76.6942], // Fish Head Cantina
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb": [39.2480, -76.6958], // Arbutus Coffee Co
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc": [39.2490, -76.6935], // Trailside Books
  "dddddddd-dddd-4ddd-8ddd-dddddddddddd": [39.2460, -76.6965], // Campus Bikes
  "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee": [39.2472, -76.6975], // Green Bean Market
}

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
  if (hours.toLowerCase().includes("closed")) return false
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
  open?: boolean | null
}

function buildSpots(businesses: Business[], posts: Post[], events: Event[]): Spot[] {
  const spots: Spot[] = []

  businesses.forEach((b, i) => {
    const pos = BUSINESS_POSITIONS[b.id] ?? [
      ARBUTUS_CENTER[0] + (Math.random() - 0.5) * 0.008,
      ARBUTUS_CENTER[1] + (Math.random() - 0.5) * 0.008,
    ]
    spots.push({
      id: `b-${b.id}`,
      type: "business",
      lat: pos[0],
      lng: pos[1],
      title: b.name,
      subtitle: b.category,
      color: categoryColor(b.category),
      businessId: b.id,
      open: isOpenNow(b.hours),
    })
  })

  events.forEach((e, i) => {
    const bizIndex = businesses.findIndex((b) => b.id === e.organizer.id)
    const biz = bizIndex >= 0 ? businesses[bizIndex] : null
    const pos = biz && BUSINESS_POSITIONS[biz.id]
      ? BUSINESS_POSITIONS[biz.id]
      : ARBUTUS_CENTER
    spots.push({
      id: `e-${e.id}`,
      type: "event",
      lat: pos[0] + 0.0005 * Math.cos(i * 1.3),
      lng: pos[1] + 0.0005 * Math.sin(i * 1.3),
      title: e.title,
      subtitle: `${e.date} · ${e.time}`,
      color: "#a03d2e",
      businessId: biz?.id,
    })
  })

  posts
    .filter((p) => p.type === "hiring")
    .forEach((p, i) => {
      const bizIndex = businesses.findIndex((b) => b.id === p.author.id)
      const biz = bizIndex >= 0 ? businesses[bizIndex] : null
      const pos = biz && BUSINESS_POSITIONS[biz.id]
        ? BUSINESS_POSITIONS[biz.id]
        : ARBUTUS_CENTER
      spots.push({
        id: `h-${p.id}`,
        type: "hiring",
        lat: pos[0] + 0.0007 * Math.cos(i * 2.1 + 1),
        lng: pos[1] + 0.0007 * Math.sin(i * 2.1 + 1),
        title: p.title,
        subtitle: `Hiring · ${p.author.name}`,
        color: "#2f6b66",
        businessId: biz?.id,
      })
    })

  posts
    .filter((p) => p.type === "volunteer")
    .forEach((p, i) => {
      const bizIndex = businesses.findIndex((b) => b.id === p.author.id)
      const biz = bizIndex >= 0 ? businesses[bizIndex] : null
      const pos = biz && BUSINESS_POSITIONS[biz.id]
        ? BUSINESS_POSITIONS[biz.id]
        : ARBUTUS_CENTER
      spots.push({
        id: `v-${p.id}`,
        type: "volunteer",
        lat: pos[0] + 0.0007 * Math.cos(i * 2.5 + 3),
        lng: pos[1] + 0.0007 * Math.sin(i * 2.5 + 3),
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

function spotIcon(spot: Spot, selected: boolean): L.DivIcon {
  const size = spot.type === "business" ? 36 : 30
  const openDot = spot.type === "business" && spot.open !== null
  const dotColor = spot.open ? "#3f6b3a" : spot.open === false ? "#a03d2e" : "#999"

  const iconPaths: Record<string, string> = {
    business: `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" fill="white"/>`,
    event: `<rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="white" stroke-width="1.5"/><line x1="16" y1="2" x2="16" y2="6" stroke="white" stroke-width="1.5"/><line x1="8" y1="2" x2="8" y2="6" stroke="white" stroke-width="1.5"/><line x1="3" y1="10" x2="21" y2="10" stroke="white" stroke-width="1.5"/>`,
    hiring: `<rect x="2" y="7" width="20" height="14" rx="2" fill="none" stroke="white" stroke-width="1.5"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" fill="none" stroke="white" stroke-width="1.5"/>`,
    volunteer: `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="white"/>`,
  }

  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;">
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${spot.color};
        border:2.5px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;
        cursor:pointer;transition:transform 0.15s;
        ${selected ? `transform:scale(1.25);box-shadow:0 0 0 3px ${spot.color}88,0 4px 12px rgba(0,0,0,0.4);` : ""}
      ">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          ${iconPaths[spot.type] ?? iconPaths.business}
        </svg>
      </div>
      ${openDot ? `
        <div style="
          position:absolute;bottom:-1px;right:-1px;
          width:10px;height:10px;border-radius:50%;
          background:${dotColor};border:2px solid white;
          box-shadow:0 1px 3px rgba(0,0,0,0.3);
        "></div>
      ` : ""}
    </div>
  `

  return L.divIcon({
    className: "",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
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
        case "open": return s.open === true || s.type === "event"
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

  useEffect(() => {
    const map = leafletMap.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    visible.forEach((spot) => {
      const marker = L.marker([spot.lat, spot.lng], { icon: spotIcon(spot, selectedId === spot.id) })
        .addTo(map)
        .on("click", () => {
          setSelectedId(spot.id)
          setSidebarOpen(true)
          map.flyTo([spot.lat, spot.lng], 17, { duration: 0.8 })
        })

      markersRef.current.push(marker)
    })
  }, [visible, selectedId])

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
        leafletMap.current?.flyTo(loc, 16, { duration: 1 })
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
              className={`shrink-0 flex items-center gap-1 border px-2.5 py-1 text-[11px] font-medium transition-all ${
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
            className="border border-[var(--hr)] p-1.5 hover:border-[var(--fg)] transition-colors"
            title="Find me"
          >
            <Crosshair size={14} strokeWidth={1.75} />
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
        <div ref={mapRef} className="absolute inset-0 z-0" />

        {/* Legend */}
        <div className="absolute top-2 left-2 z-[400] bg-[var(--bg)]/95 backdrop-blur-sm border border-[var(--hr)] px-2.5 py-1.5 text-[10px] text-[var(--dim)] shadow-sm">
          {visible.length} spot{visible.length !== 1 ? "s" : ""} · Arbutus, MD
        </div>

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
                className="text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
              >
                <X size={16} strokeWidth={1.75} />
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
                          <span className="ml-1 text-[10px] text-[var(--post-announcement)]">verified</span>
                        )}
                      </h2>
                      <p className="text-[11px] text-[var(--muted)]">{selectedBusiness.category}</p>
                      <p className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
                        <MapPin size={10} strokeWidth={1.75} /> {selectedBusiness.location}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-[11px]">
                    {openStatus !== null && (
                      <span className={`flex items-center gap-1 ${openStatus ? "text-[var(--post-volunteer)]" : "text-[var(--post-event)]"}`}>
                        <span className={`inline-block w-2 h-2 rounded-full ${openStatus ? "bg-[var(--post-volunteer)]" : "bg-[var(--post-event)]"}`} />
                        {openStatus ? "open now" : "closed"}
                      </span>
                    )}
                    <span className="text-[var(--dim)]">{selectedBusiness.hours}</span>
                  </div>

                  {selectedBusiness.studentDiscount && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--post-hiring)] bg-[var(--post-hiring)]/10 px-2 py-1 inline-block">
                      <GraduationCap size={11} strokeWidth={2} /> student discount
                    </div>
                  )}

                  {promo && (
                    <div className="mt-3 border border-dashed border-[var(--pulse-accent)] bg-[var(--pulse-accent)]/5 p-3">
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
                            className="flex items-center gap-2 border border-[var(--hr)] p-2.5 hover:border-[var(--fg)] transition-colors no-underline"
                          >
                            <CalendarDays size={14} strokeWidth={1.75} className="shrink-0 text-[var(--muted)]" />
                            <div>
                              <span className="text-xs font-bold text-[var(--fg)] block">{e.title}</span>
                              <span className="text-[11px] text-[var(--muted)]">{e.date} · {e.time}</span>
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
                      className="flex items-center justify-center gap-1.5 w-full bg-[var(--pulse-accent)] text-white px-3 py-2.5 text-xs font-medium no-underline hover:opacity-90 transition-opacity"
                    >
                      <Navigation size={12} strokeWidth={2} /> Check in
                    </Link>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBusiness.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 border border-[var(--hr)] px-3 py-2 text-xs text-[var(--fg)] no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors"
                      >
                        <MapPin size={11} strokeWidth={1.75} /> directions
                      </a>
                      <Link
                        href={`/businesses/${selectedBusiness.id}`}
                        className="flex items-center justify-center gap-1 border border-[var(--hr)] px-3 py-2 text-xs text-[var(--fg)] no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors"
                      >
                        view profile
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div>
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
                      className="mt-3 block border border-[var(--hr)] px-3 py-2 text-xs text-center text-[var(--fg)] no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors"
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
