import { createClient } from "@/lib/supabase/server"
import { canManageBusiness } from "@/lib/business-access"
import { POST_TYPES } from "@/lib/posts"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { type, title, content, image_url, business_id, event_id } = body

  if (!POST_TYPES.includes(type) || typeof title !== "string" || !title.trim() || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "type, title, and content are required" }, { status: 400 })
  }

  if ((type === "promotion" || type === "event") && (!business_id || !event_id)) {
    return NextResponse.json({ error: "a business and event are required for promotion and event posts" }, { status: 400 })
  }

  if (business_id && !(await canManageBusiness(supabase, user, business_id))) {
    return NextResponse.json({ error: "not authorized to post for this business" }, { status: 403 })
  }

  if (event_id) {
    const { data: event } = await supabase
      .from("events")
      .select("business_id")
      .eq("id", event_id)
      .maybeSingle()

    if (!event || !business_id || event.business_id !== business_id) {
      return NextResponse.json({ error: "event does not belong to this business" }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      business_id: business_id ?? null,
      event_id: event_id ?? null,
      type,
      title,
      content,
      image_url,
    })
    .select()
    .single()

  if (error) {
    console.error("post creation failed:", error)
    return NextResponse.json({ error: "We couldn't publish this post. Please check the details and try again." }, { status: 400 })
  }

  return NextResponse.json(data)
}
