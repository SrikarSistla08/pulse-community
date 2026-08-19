"use client"

import Link from "next/link"
import { useState } from "react"
import { useSupabase } from "@/lib/supabase/hooks"
import { followBusiness, unfollowBusiness } from "@/lib/supabase/queries"
import type { Business } from "@/types"
import BusinessImage from "@/components/business-image"
import { MapPin } from "lucide-react"

export default function BusinessesClient({ businesses }: { businesses: Business[] }) {
  const supabase = useSupabase()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [following, setFollowing] = useState<Record<string, boolean>>(
    Object.fromEntries(businesses.map((b) => [b.id, b.isFollowing]))
  )

  const allCategories = [...new Set(businesses.map((b) => b.category))]

  const filtered = businesses.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === "all" || b.category === category
    return matchesSearch && matchesCategory
  })

  async function toggleFollow(id: string, isNow: boolean) {
    setFollowing((f) => ({ ...f, [id]: isNow }))
    if (isNow) await followBusiness(supabase, null, id)
    else await unfollowBusiness(supabase, null, id)
  }

  return (
    <main className="pulse-shell">
      <div className="pulse-page-header">
        <div>
        <p className="pulse-kicker">local directory</p>
        <h1 className="pulse-title">Find your next favorite place.</h1>
        <p className="pulse-lede">
          {filtered.length} of {businesses.length} businesses
        </p>
        </div>
      </div>

      <div className="pulse-card mb-6 flex items-center gap-2 p-3 text-sm" role="search">
        <span className="text-[var(--muted)] shrink-0">Search</span>
        <input
          type="text"
          placeholder="by name or category..."
          className="flex-1 min-w-0 text-xs sm:text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="text-xs sm:text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">all</option>
          {allCategories.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {filtered.map((b) => (
          <Link
            key={b.id}
            href={`/businesses/${b.id}`}
            className="pulse-card block p-4 no-underline hover:border-[var(--pulse-accent)] group"
          >
            <div className="flex items-start gap-3">
              <BusinessImage name={b.name} category={b.category} logoUrl={b.logo} className="h-10 w-10 shrink-0 object-cover duotone" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold truncate">{b.name}</h3>
                <p className="text-xs text-[var(--muted)] group-hover:text-[var(--bg)]/70">{b.category}</p>
                <p className="text-xs mt-0.5 text-[var(--muted)] group-hover:text-[var(--bg)]/70">
                  <MapPin size={10} strokeWidth={1.75} /> {b.location}
                </p>
                {b.description && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--muted)] group-hover:text-[var(--fg)]">{b.description}</p>}
                <p className="mt-2 text-[10px] text-[var(--dim)]">{b.followers} followers</p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleFollow(b.id, !following[b.id])
                }}
                className={`pulse-button shrink-0 px-2 py-1 text-[10px] ${
                  following[b.id]
                     ? "border-[var(--pulse-accent)] bg-[var(--pulse-accent)] text-[var(--bg)]"
                    : "border-[var(--hr)] group-hover:border-[var(--bg)]/30"
                }`}
                aria-label={following[b.id] ? `Unfollow ${b.name}` : `Follow ${b.name}`}
              >
                {following[b.id] ? "following" : "follow"}
              </button>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="pulse-empty text-sm">
          no businesses found matching &ldquo;{search}&rdquo;
        </p>
      )}
    </main>
  )
}
