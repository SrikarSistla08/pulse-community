import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getEvents } from "@/lib/supabase/queries"
import EventsClient from "@/components/events-client"

export const metadata: Metadata = {
  title: "Events — Pulse",
  description: "Events worth leaving home for.",
}

export default async function EventsPage() {
  let events: Awaited<ReturnType<typeof getEvents>> = []

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    events = await getEvents(supabase, data.user?.id ?? null)
  }

  return <EventsClient events={events} />
}
