import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { isRole, type Role } from "@/lib/auth"
import { relativeTime } from "@/lib/supabase/queries"
import { getFollowedBusinesses, getNotificationsForUser, getSavedPosts, getUserRsvps, getUserComments } from "@/lib/supabase/queries"
import ProfileEditor from "@/components/profile-editor"
import PostCard from "@/components/post-card"
import CommunityPassCard from "@/components/community-pass-card"

const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  business: "Business",
  organization: "Organization",
  admin: "Admin",
}

function displayDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export const metadata: Metadata = {
  title: "Your Account — Pulse",
}

export default async function AccountPage() {
  if (!isSupabaseConfigured()) redirect("/login")
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/account")

  const [{ data: profile }, following, savedPosts, notifications, rsvps, comments] = await Promise.all([
    supabase.from("profiles").select("full_name, email, avatar_url, role, created_at").eq("id", user.id).maybeSingle(),
    getFollowedBusinesses(supabase, user.id),
    getSavedPosts(supabase, user.id),
    getNotificationsForUser(supabase, user.id),
    getUserRsvps(supabase, user.id),
    getUserComments(supabase, user.id),
  ])

  const fullName = profile?.full_name?.trim() || user.user_metadata?.full_name || "Pulse Member"
  const email = profile?.email || user.email || ""
  const role = isRole(profile?.role) ? profile.role : isRole(user.user_metadata?.role) ? user.user_metadata.role : "student"
  const memberSince = profile?.created_at ?? user.created_at

  return (
    <main className="pulse-shell">
      <div className="mb-10 max-w-2xl">
        <p className="pulse-kicker">personal space</p>
        <h1 className="pulse-title">Your Pulse</h1>
        <p className="pulse-lede">Every business you visit, every offer you use — all in one place.</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
        {/* Left column: pass + profile */}
        <div className="space-y-6">
          <CommunityPassCard />

          <section id="profile" className="pulse-card p-5">
            <ProfileEditor fullName={fullName} avatarUrl={profile?.avatar_url ?? ""} email={email} />
            <div className="mt-4 border-t border-[var(--hr)] pt-3 text-xs text-[var(--muted)]">
              <span>{ROLE_LABELS[role]}</span>
              <span className="mx-2">·</span>
              <span>Member since {displayDate(memberSince)}</span>
            </div>
          </section>

          <section id="following" aria-labelledby="account-following">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 id="account-following" className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">following</h2>
              <Link href="/businesses" className="text-[10px] text-[var(--muted)] hover:text-[var(--fg)]">view all &rarr;</Link>
            </div>
            <div className="pulse-card divide-y divide-[var(--hr)]">
              {following.length ? following.map((business) => (
                <Link key={business.id} href={`/businesses/${business.id}`} className="flex items-center justify-between px-3 py-2.5 text-xs no-underline hover:bg-[var(--surface-muted)] transition-colors">
                  <span className="font-bold">{business.name}</span>
                  <span className="text-[var(--muted)]">{business.category}</span>
                </Link>
              )) : <p className="px-3 py-3 text-xs text-[var(--dim)]">not following anyone yet.</p>}
            </div>
          </section>
        </div>

        {/* Right column: activity feed */}
        <div className="space-y-8">
          <section id="rsvps" aria-labelledby="account-rsvps">
            <h2 id="account-rsvps" className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">your rsvps</h2>
            <div className="pulse-card divide-y divide-[var(--hr)]">
              {rsvps.length ? rsvps.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`} className="flex items-center justify-between px-3 py-2.5 text-xs no-underline hover:bg-[var(--surface-muted)] transition-colors">
                  <div>
                    <p className="font-bold">{event.title}</p>
                    <p className="text-[var(--muted)]">{event.organizer.name} · {event.category}</p>
                  </div>
                  <span className="text-[var(--muted)] shrink-0 ml-3">{event.date}</span>
                </Link>
              )) : <p className="px-3 py-3 text-xs text-[var(--dim)]">no rsvps yet.</p>}
            </div>
          </section>

          <section id="comments" aria-labelledby="account-comments">
            <h2 id="account-comments" className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">your comments</h2>
            <div className="pulse-card divide-y divide-[var(--hr)]">
              {comments.length ? comments.map((comment) => (
                <div key={comment.id} className="px-3 py-2.5 text-xs">
                  <p className="text-[var(--muted)]">
                    on <span className="font-bold text-[var(--fg)]">{comment.postTitle}</span>
                  </p>
                  <p className="mt-1 text-[var(--fg)]">{comment.content}</p>
                  <p className="mt-1 text-[10px] text-[var(--dim)]">{relativeTime(comment.createdAt)}</p>
                </div>
              )) : <p className="px-3 py-3 text-xs text-[var(--dim)]">no comments yet.</p>}
            </div>
          </section>

          <section id="saved" aria-labelledby="account-saved">
            <h2 id="account-saved" className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">saved posts</h2>
            <div className="space-y-3">
              {savedPosts.length ? savedPosts.map((post) => <PostCard key={post.id} post={post} />) : <p className="pulse-card px-3 py-3 text-xs text-[var(--dim)]">no saved posts yet.</p>}
            </div>
          </section>

          <section id="notifications" aria-labelledby="account-notifications">
            <h2 id="account-notifications" className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">notifications</h2>
            <div className="pulse-card divide-y divide-[var(--hr)]">
              {notifications.slice(0, 5).length ? notifications.slice(0, 5).map((notification) => {
                const content = (
                  <div className="px-3 py-2.5 text-xs">
                    <p className="font-bold">{notification.title}</p>
                    {notification.body && <p className="mt-0.5 text-[var(--muted)]">{notification.body}</p>}
                    <p className="mt-0.5 text-[10px] text-[var(--dim)]">{relativeTime(notification.createdAt)}</p>
                  </div>
                )
                return notification.link ? <Link key={notification.id} href={notification.link} className="block no-underline hover:bg-[var(--surface-muted)] transition-colors">{content}</Link> : <div key={notification.id}>{content}</div>
              }) : <p className="px-3 py-3 text-xs text-[var(--dim)]">no notifications yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
