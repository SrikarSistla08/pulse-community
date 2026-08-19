"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { signOut } from "@/lib/auth-client"
import { useSupabase, useCurrentUser } from "@/lib/supabase/hooks"
import { Search, Bell, Menu, X, PenLine } from "lucide-react"

const links = [
  { href: "/", label: "Feed" },
  { href: "/map", label: "Map" },
  { href: "/events", label: "Events" },
  { href: "/businesses", label: "Businesses" },
]

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  time: string
}

function editionInfo() {
  const now = new Date()
  const week = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)
  const date = now.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
  return { vol: now.getFullYear() - 2025, date, edition: "Arbutus Edition" }
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useSupabase()
  const user = useCurrentUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifsOpen, setNotifsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const notifsRef = useRef<HTMLDivElement>(null)
  const { vol, date, edition } = editionInfo()

  function timeLabel(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  useEffect(() => {
    if (!supabase || !user) return
    let active = true
    supabase
      .from("notifications")
      .select("id, type, title, body, link, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data, error }) => {
        if (active && !error && data) {
          setNotifications(
            data.map((n) => ({
              id: n.id,
              type: n.type,
              title: n.title,
              body: n.body,
              link: n.link,
              time: timeLabel(n.created_at),
            }))
          )
        }
      })
    return () => { active = false }
  }, [supabase, user])

  useEffect(() => {
    if (!supabase || !user) return
    let active = true
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.avatar_url) setAvatarUrl(data.avatar_url)
      })
    return () => { active = false }
  }, [supabase, user])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
        setNotifsOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setNotifsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  async function handleLogout() {
    await signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-[var(--fg)] focus:text-[var(--bg)] focus:px-4 focus:py-2 focus:text-sm">
      Skip to content
    </a>
    <header className="sticky top-0 z-50 bg-[var(--bg)] border-b border-[var(--hr)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top row: masthead */}
        <div className="flex items-center justify-between py-3 border-b border-[var(--hr)]">
          <Link href="/" className="shrink-0 no-underline group">
            <div>
              <div className="text-2xl font-serif font-bold tracking-[0.04em] leading-none group-hover:text-[var(--pulse-accent)] transition-colors">
                PULSE
              </div>
              <div className="hidden md:flex items-center gap-3 text-[9px] font-mono font-bold tracking-[0.12em] uppercase text-[var(--muted)] mt-0.5">
                <span>VOL. {vol}</span>
                <span className="text-[var(--hr)]">|</span>
                <span>{date}</span>
                <span className="text-[var(--hr)]">|</span>
                <span>{edition}</span>
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-5 text-[11px] font-mono font-bold tracking-[0.1em] uppercase">
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-1 no-underline transition-colors border-b-2 ${
                    isActive
                      ? "border-[var(--pulse-accent)] text-[var(--fg)]"
                      : "border-transparent text-[var(--muted)] hover:text-[var(--fg)]"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <form onSubmit={submitSearch} className="hidden md:flex" role="search">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search..."
                aria-label="search"
                className="w-32 h-7 border border-[var(--hr)] bg-transparent px-2.5 text-[11px] font-mono focus:outline-none focus:border-[var(--fg)]"
              />
            </form>

            <Link href="/search" className="md:hidden text-[var(--muted)] hover:text-[var(--fg)] p-1.5" title="search">
              <Search size={16} strokeWidth={1.75} />
            </Link>

            <div className="relative" ref={notifsRef}>
              <button
                onClick={() => setNotifsOpen(!notifsOpen)}
                className="text-[var(--muted)] hover:text-[var(--fg)] p-1.5 relative"
                aria-label="notifications"
              >
                <Bell size={16} strokeWidth={1.75} />
                {notifications.some(() => true) && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--pulse-accent)]" />
                )}
              </button>
              {notifsOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 border border-[var(--hr)] bg-[var(--bg)] py-1 z-50">
                  <div className="px-4 py-2 text-[9px] font-mono text-[var(--dim)] uppercase tracking-wider border-b border-[var(--hr)] mb-1">
                    notifications
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-[var(--dim)]">no notifications yet</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="px-4 py-2 text-xs hover:bg-[var(--surface-muted)] cursor-pointer transition-colors">
                        <p className="font-medium">{n.title}</p>
                        {n.body && <p className="text-[10px] text-[var(--muted)] mt-0.5 line-clamp-1">{n.body}</p>}
                        <p className="text-[10px] text-[var(--dim)] mt-0.5">{n.time}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <Link
              href="/create/post"
              className="w-7 h-7 flex items-center justify-center border border-[var(--hr)] hover:border-[var(--fg)] hover:bg-[var(--fg)] hover:text-[var(--bg)] text-[var(--muted)] transition-all"
              title="create post"
            >
              <PenLine size={14} strokeWidth={1.75} />
            </Link>

            <Link
              href="/account"
              className="w-7 h-7 flex items-center justify-center overflow-hidden text-[10px] font-mono font-bold text-[var(--muted)] border border-[var(--hr)] hover:border-[var(--fg)] hover:text-[var(--fg)] no-underline transition-all"
              title="account"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                (user?.user_metadata?.full_name || user?.email || "?").slice(0, 2).toUpperCase()
              )}
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-[var(--muted)] hover:text-[var(--fg)] p-1.5"
              aria-label={mobileOpen ? "close menu" : "open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={18} strokeWidth={1.75} /> : <Menu size={18} strokeWidth={1.75} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <nav className="lg:hidden border-t border-[var(--hr)] px-4 py-3 space-y-0.5 bg-[var(--bg)]">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block text-sm py-2 no-underline ${isActive ? "font-bold text-[var(--fg)]" : "text-[var(--muted)]"}`}
              >
                {link.label}
              </Link>
            )
          })}
          <div className="border-t border-[var(--hr)] mt-2 pt-2 space-y-0.5">
            <Link href="/check-in" onClick={() => setMobileOpen(false)} className="block text-sm py-2 text-[var(--muted)] no-underline">Check-In</Link>
            <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block text-sm py-2 text-[var(--muted)] no-underline">Dashboard</Link>
            <Link href="/create/post" onClick={() => setMobileOpen(false)} className="block text-sm py-2 text-[var(--muted)] no-underline">Create Post</Link>
            <Link href="/create/event" onClick={() => setMobileOpen(false)} className="block text-sm py-2 text-[var(--muted)] no-underline">Create Event</Link>
            <Link href="/account" onClick={() => setMobileOpen(false)} className="block text-sm py-2 text-[var(--muted)] no-underline">Account</Link>
            <button onClick={handleLogout} className="block text-sm py-2 text-[var(--muted)] text-left w-full">Sign Out</button>
          </div>
        </nav>
      )}
    </header>
    </>
  )
}
