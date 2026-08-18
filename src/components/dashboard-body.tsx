import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import {
  getPosts,
  getEvents,
  getBusinesses,
  getBusinessCheckIns,
  getRewardsForUser,
  getBusinessPilotPerformance,
  type BusinessPilotPerformance,
} from "@/lib/supabase/queries"
import RewardsSummary from "@/components/rewards-summary"
import PostCard from "@/components/post-card"
import { ROLE_HOME, type Role } from "@/lib/auth"

type Organization = {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  logo_url: string | null
  tags: string[]
  verified: boolean
}

export default async function DashboardBody({ role }: { role: Role }) {
  if (role === "business") {
    let performance: BusinessPilotPerformance[] = []
    if (isSupabaseConfigured()) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      performance = await getBusinessPilotPerformance(supabase, user?.id ?? null)
      const posts = await getPosts(supabase, user?.id ?? null)
      return <BusinessPilotDashboard performance={performance} posts={posts} />
    }
    return <BusinessPilotDashboard performance={performance} posts={[]} />
  }

  if (role === "organization") {
    let organizations: Organization[] = []
    let posts: Awaited<ReturnType<typeof getPosts>> = []
    let events: Awaited<ReturnType<typeof getEvents>> = []
    let userId: string | null = null

    if (isSupabaseConfigured()) {
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      userId = data.user?.id ?? null

      if (userId) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("id, name, slug, description, category, logo_url, tags, verified")
          .eq("owner_id", userId)
          .order("name")
        organizations = orgData ?? []
      }

      ;[posts, events] = await Promise.all([
        getPosts(supabase, userId),
        getEvents(supabase),
      ])
    }

    return <OrganizationDashboard organizations={organizations} posts={posts} events={events} />
  }

  let posts: Awaited<ReturnType<typeof getPosts>> = []
  let events: Awaited<ReturnType<typeof getEvents>> = []
  let businesses: Awaited<ReturnType<typeof getBusinesses>> = []
  let checkIns: Awaited<ReturnType<typeof getBusinessCheckIns>> = []
  let rewards: Awaited<ReturnType<typeof getRewardsForUser>> = []
  let userId: string | null = null

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    userId = data.user?.id ?? null
    ;[posts, events, businesses, checkIns, rewards] = await Promise.all([
      getPosts(supabase, userId),
      getEvents(supabase),
      getBusinesses(supabase, userId),
      getBusinessCheckIns(supabase, userId),
      getRewardsForUser(supabase, userId),
    ])
  }

  const communityMetrics = [
    { label: "Businesses joined", value: businesses.length },
    { label: "Events this week", value: events.length },
    { label: "Posts this week", value: posts.length },
    { label: "Community check-ins", value: checkIns.length },
    { label: "Rewards unlocked", value: rewards.length },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h1 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
                    {role} dashboard
        </h1>
        <p className="text-xs text-[var(--dim)] mt-0.5">community &amp; business analytics</p>
      </div>

      <RewardsSummary />

      <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                community activity
      </h2>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-6">
        {communityMetrics.map((m) => (
          <div key={m.label} className="border border-[var(--hr)] p-3">
            <div className="text-xs text-[var(--muted)]">{m.label}</div>
            <div className="text-lg font-bold mt-0.5">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                    recent check-ins
          </h3>
          <div className="border border-[var(--hr)] divide-y divide-[var(--hr)]">
            {checkIns.length > 0 ? (
              checkIns.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">[{c.businessName.slice(0, 2).toUpperCase()}]</span>
                    <span>{c.businessName}</span>
                  </div>
                  <div className="text-[var(--muted)]">{c.time}</div>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-[var(--dim)]">no check-ins yet</div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                    quick actions
          </h3>
          <div className="border border-[var(--hr)] p-3 space-y-2 text-xs">
            <Link href={ROLE_HOME[role]} className="block w-full text-left border border-[var(--hr)] px-2 py-1.5 hover:bg-[var(--fg)] hover:text-[var(--bg)]">
              &gt; back to my {role} home
            </Link>
            <Link href="/pass" className="block w-full text-left border border-[var(--hr)] px-2 py-1.5 hover:bg-[var(--fg)] hover:text-[var(--bg)]">
              &gt; view community pass
            </Link>
            <Link href="/create/post" className="block w-full text-left border border-[var(--hr)] px-2 py-1.5 hover:bg-[var(--fg)] hover:text-[var(--bg)]">
              &gt; create post
            </Link>
            <Link href="/create/event" className="block w-full text-left border border-[var(--hr)] px-2 py-1.5 hover:bg-[var(--fg)] hover:text-[var(--bg)]">
              &gt; post event
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function eventStatus(startsAt: string, endsAt?: string): string {
  const now = new Date()
  if (endsAt && new Date(endsAt) < now) return "completed"
  if (new Date(startsAt) <= now) return "live"
  return "upcoming"
}

function BusinessPilotDashboard({ performance, posts }: { performance: BusinessPilotPerformance[]; posts: Awaited<ReturnType<typeof getPosts>> }) {
  return (
    <div className="pulse-shell max-w-5xl">
      <div className="pulse-page-header">
        <div>
          <p className="pulse-kicker">business studio</p>
          <h1 className="pulse-title">Your local presence.</h1>
          <p className="pulse-lede">A clear view of the community activity around your business.</p>
        </div>
      </div>

      {performance.length === 0 ? (
        <div className="border border-[var(--hr)] p-4 text-sm text-[var(--muted)]">
          No business profile is assigned to this account yet.
        </div>
      ) : (
        <div className="space-y-6">
          {performance.map(({ business, followers, checkIns, promotionPosts, events }) => (
            <section key={business.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--hr)] pb-2">
                <h2 className="text-lg font-bold">{business.name}</h2>
                <div className="flex gap-3 text-xs">
                  <Link href="/business/settings" className="pulse-button pulse-button-quiet">Edit business</Link>
                  <Link href={`/businesses/${business.id}`} className="underline">view public profile</Link>
                </div>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {business.category} · {business.location}
              </p>

              <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">recent posts</h3>
              <div className="space-y-2">
                {posts.filter((post) => post.businessId === business.id).slice(0, 3).map((post) => <PostCard key={post.id} post={post} />)}
                {posts.filter((post) => post.businessId === business.id).length === 0 && (
                  <div className="border border-[var(--hr)] px-3 py-3 text-xs text-[var(--dim)]">no posts yet.</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-6 py-4 sm:grid-cols-4">
                <div className="pulse-stat">
                  <p className="text-xs text-[var(--muted)]">Followers</p>
                  <p className="mt-0.5 text-lg font-bold">{followers}</p>
                </div>
                <div className="pulse-stat">
                  <p className="text-xs text-[var(--muted)]">Check-ins</p>
                  <p className="mt-0.5 text-lg font-bold">{checkIns}</p>
                </div>
                <div className="pulse-stat">
                  <p className="text-xs text-[var(--muted)]">Events</p>
                  <p className="mt-0.5 text-lg font-bold">{events.length}</p>
                </div>
                <div className="pulse-stat">
                  <p className="text-xs text-[var(--muted)]">Promotion posts</p>
                  <p className="mt-0.5 text-lg font-bold">{promotionPosts}</p>
                </div>
              </div>

              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                                event performance
              </h3>
              <div className="pulse-card divide-y divide-[var(--hr)]">
                {events.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-[var(--muted)]">
                    <p>No events yet.</p>
                    <p className="mt-1 text-[var(--dim)]">Create your first event to start bringing your community in.</p>
                    <Link href="/create/event" className="mt-3 inline-block border border-[var(--fg)] px-3 py-2 hover:bg-[var(--fg)] hover:text-[var(--bg)]">
                      create event
                    </Link>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="grid gap-2 px-3 py-3 text-xs sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                      <div>
                        <Link href={`/events/${event.id}`} className="font-bold hover:underline">
                          {event.title}
                        </Link>
                        <p className="mt-0.5 text-[var(--muted)]">
                          {new Date(event.startsAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <span>Status: {eventStatus(event.startsAt, event.endsAt)}</span>
                      <span>Posts: {event.promotionPosts}</span>
                      <span>Business check-ins: {checkIns}</span>
                    </div>
                  ))
                )}
              </div>
              {promotionPosts === 0 && events.length > 0 && (
                <p className="mt-2 text-xs text-[var(--dim)]">No promotion posts yet. Create one to help your event reach the community.</p>
              )}
            </section>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        <Link href="/create/event" className="border border-[var(--fg)] px-3 py-2 hover:bg-[var(--fg)] hover:text-[var(--bg)]">
          &gt; create event
        </Link>
        <Link href="/create/post" className="border border-[var(--hr)] px-3 py-2 hover:bg-[var(--fg)] hover:text-[var(--bg)]">
          &gt; create promotion post
        </Link>
      </div>
    </div>
  )
}

function OrganizationDashboard({
  organizations,
  posts,
  events,
}: {
  organizations: Organization[]
  posts: Awaited<ReturnType<typeof getPosts>>
  events: Awaited<ReturnType<typeof getEvents>>
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h1 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
                    organization dashboard
        </h1>
        <p className="text-xs text-[var(--dim)] mt-0.5">manage your organization and community presence</p>
      </div>

      {organizations.length === 0 ? (
        <div className="border border-[var(--hr)] p-4 text-sm text-[var(--muted)]">
          <p>No organization profile found.</p>
          <p className="mt-1 text-[var(--dim)]">Create your organization to start posting events and updates for the community.</p>
          <Link href="/organization/onboarding" className="mt-3 inline-block border border-[var(--fg)] px-3 py-2 text-xs hover:bg-[var(--fg)] hover:text-[var(--bg)]">
            create organization
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {organizations.map((org) => {
            const orgPosts = posts.filter((p) => p.businessId === org.id)
            return (
              <section key={org.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--hr)] pb-2">
                  <h2 className="text-lg font-bold">{org.name}</h2>
                  <div className="flex gap-3 text-xs">
                    <Link href={`/organization/${org.id}/settings`} className="border border-[var(--hr)] px-3 py-1.5 hover:bg-[var(--fg)] hover:text-[var(--bg)]">
                      Edit organization
                    </Link>
                  </div>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {org.category} {org.verified && "· verified"}
                </p>
                {org.description && (
                  <p className="mt-2 text-sm text-[var(--dim)]">{org.description}</p>
                )}
                {org.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {org.tags.map((tag) => (
                      <span key={tag} className="border border-[var(--hr)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="border border-[var(--hr)] p-3 text-center">
                    <div className="text-lg font-bold">{orgPosts.length}</div>
                    <div className="text-[10px] text-[var(--muted)]">posts</div>
                  </div>
                  <div className="border border-[var(--hr)] p-3 text-center">
                    <div className="text-lg font-bold">{events.filter((e) => e.businessId === org.id).length}</div>
                    <div className="text-[10px] text-[var(--muted)]">events</div>
                  </div>
                  <div className="border border-[var(--hr)] p-3 text-center">
                    <div className="text-lg font-bold">{events.filter((e) => new Date(e.startsAt) > new Date()).length}</div>
                    <div className="text-[10px] text-[var(--muted)]">upcoming</div>
                  </div>
                </div>

                <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                                    recent posts
                </h3>
                <div className="space-y-2">
                  {orgPosts.slice(0, 3).map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                  {orgPosts.length === 0 && (
                    <div className="border border-[var(--hr)] px-3 py-3 text-xs text-[var(--dim)]">
                      no posts yet. create your first post to reach the community.
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-2 text-xs">
                  <Link href="/create/event" className="border border-[var(--fg)] px-3 py-2 hover:bg-[var(--fg)] hover:text-[var(--bg)]">
                    &gt; create event
                  </Link>
                  <Link href="/create/post" className="border border-[var(--hr)] px-3 py-2 hover:bg-[var(--fg)] hover:text-[var(--bg)]">
                    &gt; create post
                  </Link>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
