"use client"

import { useState } from "react"
import EventCard from "@/components/event-card"
import type { Event } from "@/types"

export default function EventsClient({ events }: { events: Event[] }) {
  const [tab, setTab] = useState("all")

  const now = new Date()

  const filtered = events.filter((e) => {
    const d = new Date(e.startsAt)
    switch (tab) {
      case "this week":
        return (
          !Number.isNaN(d.getTime()) &&
          d >= now &&
          d <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        )
      case "this month":
        return (
          !Number.isNaN(d.getTime()) &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        )
      case "upcoming":
        return !Number.isNaN(d.getTime()) && d >= now
      default:
        return true
    }
  })

  return (
    <main className="pulse-shell">
      <div className="pulse-page-header">
        <div>
        <p className="pulse-kicker">community calendar</p>
        <h1 className="pulse-title">Events worth leaving home for.</h1>
        <p className="pulse-lede">
          {filtered.length} upcoming events
        </p>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2 text-sm">
        {["all", "this week", "this month", "upcoming"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pulse-button ${
              tab === t
                ? "pulse-button-primary"
                : ""
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="pulse-empty text-sm">No events in this view. Try another time window.</p>
      )}
    </main>
  )
}
