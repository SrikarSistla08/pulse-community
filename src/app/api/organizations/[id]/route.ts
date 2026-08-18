import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { id } = await params
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle()

  if (orgError || !org) {
    return NextResponse.json({ error: "organization not found or you are not the owner" }, { status: 404 })
  }

  const body = await request.json()
  const { name, description, category, email, website, logo_url, cover_url, tags } = body

  const updates: Record<string, unknown> = {}
  if (typeof name === "string" && name.trim()) updates.name = name.trim()
  if (typeof description === "string") updates.description = description.trim() || null
  if (typeof category === "string") updates.category = category
  if (typeof email === "string") updates.email = email.trim() || null
  if (typeof website === "string") updates.website = website.trim() || null
  if (typeof logo_url === "string") updates.logo_url = logo_url.trim() || null
  if (typeof cover_url === "string") updates.cover_url = cover_url.trim() || null
  if (typeof tags === "string") {
    updates.tags = tags.split(",").map((t: string) => t.trim()).filter(Boolean)
  } else if (Array.isArray(tags)) {
    updates.tags = tags
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("organization update failed:", error)
    return NextResponse.json({ error: "We couldn't update your organization. Please try again." }, { status: 400 })
  }
  return NextResponse.json(data)
}
