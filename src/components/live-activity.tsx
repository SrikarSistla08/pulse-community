"use client"

import { useEffect, useState } from "react"
import { relativeTime } from "@/lib/supabase/queries"
import type { Post, Event } from "@/types"

interface Activity {
  id: string
  icon: string
  text: string
  time: string
  color: string
}

function buildActivities(posts: Post[], events: Event[]): Activity[] {
  const list: Activity[] = []

  posts.forEach((p) => {
    list.push({
      id: `post-${p.id}`,
      icon: "•",
      text: `${p.author.name} — ${p.title}`,
      time: p.createdAt,
      color: "var(--pulse-accent)",
    })
  })

  events.forEach((e) => {
    list.push({
      id: `event-${e.id}`,
      icon: "🎉",
      text: `${e.organizer.name} created ${e.title}`,
      time: e.startsAt,
      color: "var(--pulse-accent)",
    })
  })

  return list
}

export default function LiveActivity({ posts, events }: { posts: Post[]; events: Event[] }) {
  const [visible, setVisible] = useState<Activity[]>([])

  useEffect(() => {
    const built = buildActivities(posts, events)
    const initial = built.slice(0, 5)
    setVisible(initial)

    if (built.length <= 5) return

    let offset = 0
    const interval = setInterval(() => {
      offset = (offset + 1) % built.length
      setVisible([...built.slice(offset), ...built.slice(0, offset)].slice(0, 5))
    }, 4000)
    return () => clearInterval(interval)
  }, [posts, events])

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-mono text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--fg)] border-b border-[var(--fg)] pb-2">
                    live activity
        </h3>
        <span className="relative flex h-2 w-2 pb-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--post-event)] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--post-event)]" />
        </span>
      </div>
      <ul className="space-y-2.5 text-xs">
        {visible.length === 0 && Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex gap-2 leading-snug">
            <span className="shrink-0 pulse-skeleton h-3 w-3 rounded-full" />
            <span className="flex-1 space-y-1">
              <span className="pulse-skeleton h-3 w-4/5 inline-block" />
            </span>
          </li>
        ))}
        {visible.map((a) => (
          <li key={a.id} className="flex gap-2 leading-snug">
            <span className="shrink-0 text-[var(--pulse-accent)]" style={{ color: a.color }}>{a.icon}</span>
            <span>
              <span className="text-[var(--muted)]">{a.text}</span>{" "}
              <span className="text-[var(--dim)]">({relativeTime(a.time)})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
