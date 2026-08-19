"use client"

import Link from "next/link"
import { Suspense, useMemo, useState } from "react"
import type { Business, Post, Event } from "@/types"
import BusinessImage from "@/components/business-image"
import { Search } from "lucide-react"

type SearchClientProps = {
  businesses: Business[]
  posts: Post[]
  events: Event[]
  initialQuery: string
}

function SearchInner({ businesses, posts, events, initialQuery }: SearchClientProps) {
  const [q, setQ] = useState(initialQuery)

  const results = useMemo(() => {
    if (!q) return null
    const match = (...fields: (string | undefined)[]) =>
      fields.some((f) => f?.toLowerCase().includes(q.toLowerCase()))

    const biz = businesses.filter((b) => match(b.name, b.category, b.description, b.location))
    const org = businesses.filter(
      (b) => b.category === "Community" && match(b.name, b.description)
    )
    const ev = events.filter((e) => match(e.title, e.description, e.location))
    const jobs = posts.filter((p) => p.type === "hiring" && match(p.title, p.content))
    const vol = posts.filter((p) => p.type === "volunteer" && match(p.title, p.content))

    return { biz, org, ev, jobs, vol }
  }, [q, businesses, posts, events])

  const total = results
    ? results.biz.length + results.org.length + results.ev.length + results.jobs.length + results.vol.length
    : 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
        / search
      </h1>
      <p className="text-xs text-[var(--dim)] mb-5">
        businesses · events · organizations · jobs · volunteer
      </p>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="border border-[var(--hr)] flex items-stretch mb-6"
        role="search"
      >
        <input
          autoFocus
          defaultValue={q}
          onChange={(e) => {
            const v = e.target.value.trim()
            setQ(v)
            const url = new URL(window.location.href)
            if (v) url.searchParams.set("q", v)
            else url.searchParams.delete("q")
            window.history.replaceState({}, "", url.toString())
          }}
          placeholder="search the community…"
          aria-label="search"
          className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none"
        />
        <span className="border-l border-[var(--hr)] px-3 py-2.5 text-xs text-[var(--dim)] flex items-center">
          <Search size={14} strokeWidth={1.75} />
        </span>
      </form>

      {!q && (
        <div className="border border-dashed border-[var(--hr)] p-8 text-center text-xs text-[var(--dim)]">
          type above to search businesses, events, jobs &amp; volunteer opportunities in Arbutus
        </div>
      )}

      {q && total === 0 && (
        <div className="border border-[var(--hr)] p-8 text-center text-xs text-[var(--muted)]">
          no results for &ldquo;{q}&rdquo;
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {results.biz.length > 0 && (
            <ResultGroup label="businesses" count={results.biz.length}>
              {results.biz.map((b) => (
                <ResultRow
                  key={b.id}
                  href={`/businesses/${b.id}`}
                  logo={b.logo}
                  title={b.name}
                  meta={`${b.category} · ${b.location}`}
                />
              ))}
            </ResultGroup>
          )}

          {results.org.length > 0 && (
            <ResultGroup label="organizations" count={results.org.length}>
              {results.org.map((b) => (
                <ResultRow
                  key={b.id}
                  href={`/businesses/${b.id}`}
                  logo={b.logo}
                  title={b.name}
                  meta={b.description}
                />
              ))}
            </ResultGroup>
          )}

          {results.ev.length > 0 && (
            <ResultGroup label="events" count={results.ev.length}>
              {results.ev.map((e) => (
                <ResultRow
                  key={e.id}
                  href={`/events/${e.id}`}
                  logo={e.organizer.logo}
                  title={e.title}
                  meta={`${e.date} · ${e.location}`}
                />
              ))}
            </ResultGroup>
          )}

          {results.jobs.length > 0 && (
            <ResultGroup label="jobs" count={results.jobs.length}>
              {results.jobs.map((p) => (
                <ResultRow
                  key={p.id}
                  href={`/posts/${p.id}`}
                  logo={p.author.logo}
                  title={p.title}
                  meta={`${p.author.name} · ${p.content}`}
                />
              ))}
            </ResultGroup>
          )}

          {results.vol.length > 0 && (
            <ResultGroup label="volunteer" count={results.vol.length}>
              {results.vol.map((p) => (
                <ResultRow
                  key={p.id}
                  href={`/posts/${p.id}`}
                  logo={p.author.logo}
                  title={p.title}
                  meta={`${p.author.name} · ${p.content}`}
                />
              ))}
            </ResultGroup>
          )}
        </div>
      )}
    </div>
  )
}

function ResultGroup({
  label,
  count,
  children,
}: {
  label: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
        / {label} <span className="text-[var(--dim)]">({count})</span>
      </h2>
      <div className="border border-[var(--hr)] divide-y divide-[var(--hr)]">
        {children}
      </div>
    </section>
  )
}

function ResultRow({
  href,
  logo,
  title,
  meta,
}: {
  href: string
  logo: string
  title: string
  meta: string
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] group">
      <BusinessImage name={title} category={meta.split(" · ")[0]} logoUrl={logo} className="h-8 w-8 shrink-0 object-cover duotone" />
      <div className="min-w-0">
        <div className="text-sm font-bold truncate">{title}</div>
        <div className="text-[11px] text-[var(--muted)] group-hover:text-[var(--bg)]/70 truncate">
          {meta}
        </div>
      </div>
    </Link>
  )
}

export default function SearchClient(props: SearchClientProps) {
  return (
    <Suspense fallback={<div className="text-xs text-[var(--muted)] p-8">loading…</div>}>
      <SearchInner {...props} />
    </Suspense>
  )
}
