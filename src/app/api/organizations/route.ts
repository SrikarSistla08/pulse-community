import { createClient } from "@/lib/supabase/server"
import { getCurrentRole } from "@/lib/business-access"
import { NextResponse } from "next/server"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const role = await getCurrentRole(supabase, user)
  if (role !== "organization" && role !== "admin") {
    return NextResponse.json({ error: "only organization admins can create organizations" }, { status: 403 })
  }

  const body = await request.json()
  const { name, description, category, email, website, logo_url, cover_url, tags } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: "organization name is required" }, { status: 400 })
  }

  const slug = slugify(name)
  const tagsArray = typeof tags === "string"
    ? tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    : Array.isArray(tags) ? tags : []

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      owner_id: user.id,
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      category: category || "Community",
      email: email?.trim() || null,
      website: website?.trim() || null,
      logo_url: logo_url?.trim() || null,
      cover_url: cover_url?.trim() || null,
      tags: tagsArray,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "An organization with this name already exists." }, { status: 409 })
    }
    console.error("organization creation failed:", error)
    return NextResponse.json({ error: "We couldn't create your organization. Please try again." }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, description, category, logo_url, tags, verified")
    .eq("owner_id", user.id)
    .order("name")

  if (error) {
    return NextResponse.json({ error: "failed to fetch organizations" }, { status: 500 })
  }

  return NextResponse.json(data)
}
