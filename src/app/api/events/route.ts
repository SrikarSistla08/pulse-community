import { createClient } from "@/lib/supabase/server"
import { canManageBusiness } from "@/lib/business-access"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, starts_at, ends_at, location, category, image_url, capacity, business_id } = body

  if (!business_id || !(await canManageBusiness(supabase, user, business_id))) {
    return NextResponse.json({ error: "not authorized to create an event for this business" }, { status: 403 })
  }

  const startsAt = new Date(starts_at)
  const endsAt = ends_at ? new Date(ends_at) : null
  if (!title || !description || !location || Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime()))) {
    return NextResponse.json({ error: "Please complete the required event fields." }, { status: 400 })
  }
  if (endsAt && endsAt <= startsAt) {
    return NextResponse.json({ error: "End time must be later than start time." }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      organizer_id: user.id,
      business_id,
      title,
      description,
      starts_at,
      ends_at: ends_at ?? null,
      location,
      category: category ?? "Social",
      image_url,
      capacity: capacity ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error("event creation failed:", error)
    return NextResponse.json({ error: "We couldn't publish this event. Please check the event details and try again." }, { status: 400 })
  }

  return NextResponse.json(data)
}
