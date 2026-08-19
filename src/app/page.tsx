import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getPosts, getUpcomingEvents, getBusinesses, getHappeningToday } from "@/lib/supabase/queries"
import PostCard from "@/components/post-card"
import EventCard from "@/components/event-card"
import SectionHeader from "@/components/section-header"
import Sidebar from "@/components/sidebar"
import HeroSpotlight from "@/components/hero-spotlight"
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
      <HeroSpotlight events={happeningToday} businesses={businesses} posts={posts} />
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">

          <hr />

          <NearbyBusinesses businesses={businesses} />

          <hr />

          <section>
            <SectionHeader label="community feed" count={posts.length} />
            <div>
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
