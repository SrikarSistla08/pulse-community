"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { signOut } from "@/lib/auth-client"
import { useSupabase, useCurrentUser } from "@/lib/supabase/hooks"

const links = [
  { href: "/", label: "Feed" },
  { href: "/businesses", label: "Businesses" },
  { href: "/events", label: "Events" },
  { href: "/map", label: "Map" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/check-in", label: "Check-In" },
]

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  time: string
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useSupabase()
  const user = useCurrentUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifsOpen, setNotifsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const notifsRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)

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

    return () => {
      active = false
    }
  }, [supabase, user])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
        setNotifsOpen(false)
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setNotifsOpen(false)
        setAccountOpen(false)
      }
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
    router.push(`/search?q=${encodeURIComponent(query)}`)
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
    <header className="sticky top-0 z-50 border-b border-[var(--hr)] bg-[var(--bg)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 no-underline hover:color-unset group">
          <div className="text-xl font-bold tracking-[0.18em] leading-none group-hover:text-[var(--pulse-accent)] transition-colors">
            PULSE
          </div>
          <div className="text-[9px] text-[var(--dim)] tracking-[0.08em] uppercase mt-0.5">
            heartbeat of your community
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 overflow-x-auto text-sm no-scrollbar sm:flex">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <span key={link.href} className="flex items-center whitespace-nowrap">
                <Link
                  href={link.href}
                  className={`rounded-md px-2.5 py-1.5 leading-none no-underline transition-colors ${
                    isActive
                      ? "text-[var(--pulse-accent)] font-semibold"
                      : "text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  {link.label}
                </Link>
              </span>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 text-xs sm:text-sm ml-auto shrink-0">
          <form onSubmit={submitSearch} className="hidden items-center lg:flex" role="search">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search…"
              aria-label="search"
              className="w-40 border border-[var(--hr)] bg-[var(--surface)] px-2.5 py-1.5 text-xs focus:outline-none focus:border-[var(--fg)]"
            />
            <button
              type="submit"
              aria-label="submit search"
              className="border border-[var(--fg)] px-2.5 py-1.5 hover:bg-[var(--fg)] hover:text-[var(--bg)]"
            >
              &rarr;
            </button>
          </form>

          <Link href="/search" className="lg:hidden text-[var(--muted)] hover:text-[var(--fg)] px-1.5" title="search">
            &#128269;
          </Link>

          <div className="relative" ref={notifsRef}>
            <button
              onClick={() => { setNotifsOpen(!notifsOpen); setAccountOpen(false) }}
              className="text-[var(--muted)] hover:text-[var(--fg)] px-1.5 relative"
              aria-label="notifications"
            >
              &#9828;
              {notifications.some(() => true) && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--pulse-accent)]" />
              )}
            </button>
            {notifsOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 border border-[var(--hr)] bg-[var(--bg)] py-1 z-50 shadow-lg">
                <div className="px-4 py-2 text-[10px] text-[var(--dim)] uppercase tracking-wider border-b border-[var(--hr)] mb-1">
                  notifications
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-[var(--dim)]">
                    no notifications yet
                  </div>
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

          <div className="relative" ref={accountRef}>
            <button
              onClick={() => { setAccountOpen(!accountOpen); setNotifsOpen(false) }}
              className="text-[var(--muted)] hover:text-[var(--fg)] px-1.5"
              aria-label="open account menu"
              aria-expanded={accountOpen}
            >
              {(user?.user_metadata?.full_name || user?.email || "?").slice(0, 2).toUpperCase()}
            </button>
            {accountOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-44 border border-[var(--hr)] bg-[var(--bg)] py-1 text-xs shadow-lg">
                <Link href="/account" onClick={() => setAccountOpen(false)} className="block px-4 py-2 no-underline hover:bg-[var(--surface-muted)] transition-colors">account</Link>
                <Link href="/account#saved" onClick={() => setAccountOpen(false)} className="block px-4 py-2 no-underline hover:bg-[var(--surface-muted)] transition-colors">saved</Link>
                <Link href="/check-in" onClick={() => setAccountOpen(false)} className="block px-4 py-2 no-underline hover:bg-[var(--surface-muted)] transition-colors">check-ins</Link>
                <Link href="/account#rewards" onClick={() => setAccountOpen(false)} className="block px-4 py-2 no-underline hover:bg-[var(--surface-muted)] transition-colors">rewards</Link>
                <Link href="/account#settings" onClick={() => setAccountOpen(false)} className="block px-4 py-2 no-underline hover:bg-[var(--surface-muted)] transition-colors">settings</Link>
                <div className="border-t border-[var(--hr)] mt-1 pt-1">
                  <button onClick={handleLogout} className="block w-full px-4 py-2 text-left hover:bg-[var(--surface-muted)] transition-colors">sign out</button>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/create/post"
            className="pulse-button-accent text-[10px] font-bold px-3 py-1.5 hidden sm:inline-flex items-center"
            title="create post"
          >
            +
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden border border-[var(--fg)] px-2 py-1 text-xs"
            aria-label={mobileOpen ? "close menu" : "open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? "[ x ]" : "[ = ]"}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-nav" className="sm:hidden border-t border-[var(--hr)] px-4 py-4 space-y-1 bg-[var(--bg)]">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block text-sm py-2 no-underline ${
                  isActive ? "font-bold text-[var(--fg)]" : "text-[var(--muted)]"
                }`}
              >
                &gt; {link.label}
              </Link>
            )
          })}
          <hr className="my-3" />
          <Link
            href="/create/post"
            onClick={() => setMobileOpen(false)}
            className="block text-sm py-2 text-[var(--muted)] no-underline"
          >
            &gt; create post
          </Link>
          <Link
            href="/create/event"
            onClick={() => setMobileOpen(false)}
            className="block text-sm py-2 text-[var(--muted)] no-underline"
          >
            &gt; create event
          </Link>
          <Link
            href="/account"
            onClick={() => setMobileOpen(false)}
            className="block text-sm py-2 text-[var(--muted)] no-underline"
          >
            &gt; account
          </Link>
        </nav>
      )}
    </header>
    </>
  )
}
