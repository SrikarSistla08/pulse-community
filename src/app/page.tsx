import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getPosts, getUpcomingEvents, getBusinesses, getHappeningToday } from "@/lib/supabase/queries"
import PostCard from "@/components/post-card"
import EventCard from "@/components/event-card"
import SectionHeader from "@/components/section-header"
import Sidebar from "@/components/sidebar"
import HappeningToday from "@/components/happening-today"
import NearbyBusinesses from "@/components/nearby-businesses"
import HiringAndVolunteer from "@/components/hiring-volunteer"
import ExploreCommunity from "@/components/explore-community"

export const metadata: Metadata = {
  title: "Pulse — What's happening around you",
  description: "Discover independent places, community energy, and the next reason to go somewhere.",
}

export default async function HomePage() {
  let posts: Awaited<ReturnType<typeof getPosts>> = []
  let events: Awaited<ReturnType<typeof getUpcomingEvents>> = []
  let businesses: Awaited<ReturnType<typeof getBusinesses>> = []
  let happeningToday: Awaited<ReturnType<typeof getHappeningToday>> = []

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    ;[posts, events, businesses, happeningToday] = await Promise.all([
      getPosts(supabase),
      getUpcomingEvents(supabase),
      getBusinesses(supabase),
      getHappeningToday(supabase),
    ])
  }

  return (
    <main className="pulse-shell">
      <div className="mb-14 max-w-2xl mx-auto text-center">
        <p className="pulse-kicker">the local pulse</p>
        <h1 className="pulse-title">What&apos;s happening around you.</h1>
        <p className="pulse-lede mx-auto">Discover independent places, community energy, and the next reason to go somewhere.</p>
      </div>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          <HappeningToday events={happeningToday} />

          <hr />

          <NearbyBusinesses businesses={businesses} />

          <hr />

          <section>
            <SectionHeader label="community feed" count={posts.length} />
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>

          <hr />

          <section>
            <SectionHeader label="upcoming events" count={events.length} />
            <div className="grid gap-2 sm:grid-cols-2">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>

          <hr />

          <HiringAndVolunteer posts={posts} />

          <hr />

          <ExploreCommunity businesses={businesses} />
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24">
            <Sidebar businesses={businesses} posts={posts} events={events} />
          </div>
        </div>
      </div>
    </main>
  )
}
