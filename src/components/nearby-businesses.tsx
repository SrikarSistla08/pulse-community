"use client"

import Link from "next/link"
import { useState } from "react"
import { useSupabase, useCurrentUser } from "@/lib/supabase/hooks"
import { followBusiness, unfollowBusiness } from "@/lib/supabase/queries"
import SectionHeader from "@/components/section-header"
import type { Business } from "@/types"
import BusinessImage from "@/components/business-image"

export default function NearbyBusinesses({ businesses }: { businesses: Business[] }) {
  const supabase = useSupabase()
  const user = useCurrentUser()
  const [following, setFollowing] = useState<Record<string, boolean>>(
    Object.fromEntries(businesses.map((b) => [b.id, b.isFollowing]))
  )

  async function toggleFollow(id: string, isNow: boolean) {
    setFollowing((f) => ({ ...f, [id]: isNow }))
    if (isNow) await followBusiness(supabase, user?.id ?? null, id)
    else await unfollowBusiness(supabase, user?.id ?? null, id)
  }

  return (
    <section>
      <SectionHeader label="featured businesses" count={businesses.length} plain />
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {businesses.map((biz) => (
          <div key={biz.id} className="w-40 shrink-0">
            <Link
              href={`/businesses/${biz.id}`}
              className="block pulse-card overflow-hidden no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] group"
            >
              <BusinessImage name={biz.name} category={biz.category} logoUrl={biz.logo} coverUrl={biz.coverImage} variant="cover" className="h-20 w-full object-cover duotone" />
              <div className="p-2.5">
                <h3 className="text-xs font-bold truncate">{biz.name}</h3>
                <p className="text-[10px] text-[var(--muted)] truncate">{biz.category}</p>
                <p className="text-[10px] text-[var(--muted)] truncate">
                  &#9906; {biz.location}
                </p>
              </div>
            </Link>
            <button
              onClick={() => toggleFollow(biz.id, !following[biz.id])}
              className={`w-full mt-1 text-[10px] border px-2 py-0.5 ${
                following[biz.id]
                  ? "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]"
                  : "border-[var(--hr)] hover:border-[var(--fg)]"
              }`}
              aria-label={following[biz.id] ? `Unfollow ${biz.name}` : `Follow ${biz.name}`}
            >
              {following[biz.id] ? "following" : "+ follow"}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
