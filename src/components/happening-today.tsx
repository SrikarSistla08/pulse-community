import Link from "next/link"
import SectionHeader from "@/components/section-header"
import { Flame, MapPin } from "lucide-react"
import type { Event } from "@/types"

export default function HappeningToday({ events }: { events: Event[] }) {
  if (events.length === 0) return null

  return (
    <section>
      <SectionHeader label="featured today" count={events.length} />
      <div className="grid gap-2 sm:grid-cols-2">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="block border border-[var(--fg)] no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)]"
          >
            {event.image ? <div className="duotone"><img src={event.image} alt={event.title} className="w-full h-28 object-cover border-b border-[var(--fg)]" /></div> : <div className="h-28 border-b border-[var(--fg)]" />}
            <div className="p-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                  <Flame size={10} strokeWidth={2} /> {event.time}
                </span>
                <span className="text-[10px] text-[var(--muted)]">{event.organizer.name}</span>
              </div>
              <h3 className="text-sm font-bold leading-tight">{event.title}</h3>
              <p className="text-[11px] text-[var(--muted)] mt-0.5 flex items-center gap-1">
                <MapPin size={10} strokeWidth={1.75} /> {event.location}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
