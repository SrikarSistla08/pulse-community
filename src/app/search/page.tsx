import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getBusinesses, getPosts, getEvents } from "@/lib/supabase/queries"
import type { Business, Post, Event } from "@/types"
import SearchClient from "./search-client"

export const metadata: Metadata = {
  title: "Search — Pulse",
  description: "Search businesses, events, jobs, and volunteer opportunities.",
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  let businesses: Business[] = []
  let posts: Post[] = []
  let events: Event[] = []
  let q = ""

  const params = await searchParams
  q = (params.q ?? "").trim()

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    const userId = data.user?.id ?? null

    ;[businesses, posts, events] = await Promise.all([
      getBusinesses(supabase, userId),
      getPosts(supabase, userId),
      getEvents(supabase, userId),
    ])
  }

  return (
    <SearchClient
      businesses={businesses}
      posts={posts}
      events={events}
      initialQuery={q}
    />
  )
}
