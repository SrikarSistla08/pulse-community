import Link from "next/link"
import LiveActivity from "@/components/live-activity"
import type { Business, Post, Event } from "@/types"

export default function Sidebar({ businesses, posts, events }: { businesses: Business[]; posts: Post[]; events: Event[] }) {
  const sorted = [...businesses].sort((a, b) => b.followers - a.followers)

  const metrics = [
    { label: "Businesses joined", value: String(businesses.length) },
    { label: "Events this week", value: String(events.length) },
    { label: "Posts this week", value: String(posts.length) },
  ]

  return (
    <aside className="space-y-6">
      <div className="border border-[var(--hr)] p-4">
        <LiveActivity posts={posts} events={events} />
      </div>

      <div className="border border-[var(--hr)] p-4">
        <h3 className="font-mono text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--fg)] border-b border-[var(--fg)] pb-2 mb-3">
          community activity
        </h3>
        <ul className="space-y-2 text-[15px]">
          {metrics.map((m) => (
            <li key={m.label} className="flex justify-between">
              <span className="text-[var(--muted)] text-sm">{m.label}</span>
              <span>{m.value}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border border-[var(--hr)] p-4">
        <h3 className="font-mono text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--fg)] border-b border-[var(--fg)] pb-2 mb-3">
          trending
        </h3>
        <ul className="space-y-2 text-[15px]">
          {sorted.map((biz) => (
            <li key={biz.id}>
              <Link href={`/businesses/${biz.id}`} className="text-sm no-underline hover:underline">
                &gt; {biz.name} <span className="text-[var(--dim)]">({biz.followers})</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
