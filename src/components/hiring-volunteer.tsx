import Link from "next/link"
import { relativeTime } from "@/lib/supabase/queries"
import SectionHeader from "@/components/section-header"
import BusinessImage from "@/components/business-image"
import type { Post } from "@/types"

export default function HiringAndVolunteer({ posts }: { posts: Post[] }) {
  const hiringPosts = posts.filter((p) => p.type === "hiring")
  const volunteerPosts = posts.filter((p) => p.type === "volunteer")

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <section>
        <SectionHeader label="hiring nearby" count={hiringPosts.length} plain />
        <div className="space-y-2">
          {hiringPosts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="block pulse-card p-3 no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)]"
            >
              <div className="flex items-center gap-2 mb-1">
                <BusinessImage name={post.author.name} category={post.author.category} logoUrl={post.author.logo} className="h-5 w-5 object-cover duotone" />
                <span className="text-[11px] font-bold">{post.author.name}</span>
                <span className="text-[9px] text-[var(--muted)] ml-auto">{relativeTime(post.createdAt)}</span>
              </div>
              <h3 className="text-xs font-bold leading-tight">{post.title}</h3>
              <p className="text-[11px] text-[var(--muted)] line-clamp-1 mt-0.5">{post.content}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader label="volunteer opportunities" count={volunteerPosts.length} plain />
        <div className="space-y-2">
          {volunteerPosts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="block pulse-card p-3 no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)]"
            >
              <div className="flex items-center gap-2 mb-1">
                <BusinessImage name={post.author.name} category={post.author.category} logoUrl={post.author.logo} className="h-5 w-5 object-cover duotone" />
                <span className="text-[11px] font-bold">{post.author.name}</span>
                <span className="text-[9px] text-[var(--muted)] ml-auto">{relativeTime(post.createdAt)}</span>
              </div>
              <h3 className="text-xs font-bold leading-tight">{post.title}</h3>
              <p className="text-[11px] text-[var(--muted)] line-clamp-1 mt-0.5">{post.content}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
