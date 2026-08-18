import { createClient } from "@/lib/supabase/server"
import { canManageBusiness } from "@/lib/business-access"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { id } = await params
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("business_id")
    .eq("id", id)
    .maybeSingle()

  if (eventError || !event) {
    return NextResponse.json({ error: "event not found" }, { status: 404 })
  }
  if (!event.business_id || !(await canManageBusiness(supabase, user, event.business_id))) {
    return NextResponse.json({ error: "not authorized to edit this event" }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, starts_at, ends_at, location, category, image_url, capacity } = body

  const startsAt = starts_at ? new Date(starts_at) : null
  const endsAt = ends_at ? new Date(ends_at) : null
  if (startsAt && endsAt && endsAt <= startsAt) {
    return NextResponse.json({ error: "End time must be later than start time." }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (typeof title === "string" && title.trim()) updates.title = title.trim()
  if (typeof description === "string" && description.trim()) updates.description = description.trim()
  if (typeof location === "string" && location.trim()) updates.location = location.trim()
  if (starts_at) updates.starts_at = starts_at
  if (ends_at !== undefined) updates.ends_at = ends_at ?? null
  if (category !== undefined) updates.category = category
  if (image_url !== undefined) updates.image_url = image_url
  if (capacity !== undefined) updates.capacity = capacity ?? null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("event update failed:", error)
    return NextResponse.json({ error: "We couldn't update this event. Please try again." }, { status: 400 })
  }
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { id } = await params
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("business_id")
    .eq("id", id)
    .maybeSingle()

  if (eventError || !event) {
    return NextResponse.json({ error: "event not found" }, { status: 404 })
  }
  if (!event.business_id || !(await canManageBusiness(supabase, user, event.business_id))) {
    return NextResponse.json({ error: "not authorized to delete this event" }, { status: 403 })
  }

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("event deletion failed:", error)
    return NextResponse.json({ error: "We couldn't delete this event. Please try again." }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
