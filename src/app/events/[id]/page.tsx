import Link from "next/link"
import { notFound } from "next/navigation"
import EventActions from "@/components/event-actions"
import { createClient } from "@/lib/supabase/server"
import { getEventById } from "@/lib/supabase/queries"

function eventStatus(startsAt: string, endsAt?: string): string {
  const now = new Date()
  if (endsAt && new Date(endsAt) < now) return "completed"
  if (new Date(startsAt) <= now) return "happening now"
  return "upcoming"
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const event = await getEventById(supabase, id, user?.id ?? null)

  if (!event) notFound()

  return (
    <main className="pulse-shell max-w-3xl">
      <Link href="/events" className="text-xs text-[var(--muted)] hover:underline">
        &larr; all events
      </Link>

      <article className="pulse-card mt-4 overflow-hidden">
        {event.image && (
          <div>
            <img src={event.image} alt={event.title} className="w-full h-48 sm:h-64 object-cover border-b border-[var(--hr)] duotone" />
          </div>
        )}

        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--muted)]">
            <span>{event.category}</span>
            <span>/</span>
            <span>{eventStatus(event.startsAt, event.endsAt)}</span>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{event.title}</h1>

          {event.businessId ? (
            <Link href={`/businesses/${event.businessId}`} className="mt-1 inline-block text-sm underline">
              {event.organizer.name}
            </Link>
          ) : (
            <p className="mt-1 text-sm">{event.organizer.name}</p>
          )}

          <div className="mt-5 grid gap-3 border-y border-[var(--hr)] py-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">date and time</p>
              <p className="mt-0.5">{event.date}</p>
              <p>{event.time}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">location</p>
              <p className="mt-0.5">{event.location}</p>
              {event.capacity && <p className="text-[var(--muted)]">capacity: {event.capacity}</p>}
              {event.rsvpCount > 0 && (
                <p className="text-[var(--muted)]">
                  {event.rsvpCount} {event.rsvpCount === 1 ? "person" : "people"} going
                </p>
              )}
            </div>
          </div>

          <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed">{event.description}</p>

          <div className="mt-6">
            <EventActions
              eventId={event.id}
              businessId={event.businessId}
              isFollowing={event.organizer.isFollowing}
              isRsvped={event.isRsvped}
              rsvpCount={event.rsvpCount}
              capacity={event.capacity}
            />
          </div>
        </div>
      </article>
    </main>
  )
}
