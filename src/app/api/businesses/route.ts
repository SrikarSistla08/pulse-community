import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentRole } from "@/lib/business-access"
import { parseBusinessFields, slugify } from "@/lib/business-fields"

async function getAuthenticatedBusinessUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedBusinessUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const role = await getCurrentRole(supabase, user)
  if (role !== "business" && role !== "admin") {
    return NextResponse.json({ error: "only business users can create a business profile" }, { status: 403 })
  }

  const parsed = parseBusinessFields(await request.json())
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const baseSlug = slugify(parsed.data.name)
  if (!baseSlug) return NextResponse.json({ error: "business name must contain letters or numbers" }, { status: 400 })

  let slug = baseSlug
  for (let suffix = 2; suffix <= 100; suffix += 1) {
    const { data: existing } = await supabase.from("businesses").select("id").eq("slug", slug).maybeSingle()
    if (!existing) break
    slug = `${baseSlug}-${suffix}`
  }

  const { data, error } = await supabase
    .from("businesses")
    .insert({ ...parsed.data, owner_id: user.id, slug })
    .select("id, name, slug")
    .single()

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "that business name is already in use" }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const { supabase, user } = await getAuthenticatedBusinessUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const role = await getCurrentRole(supabase, user)
  if (role !== "business") return NextResponse.json({ error: "only business owners can edit business profiles" }, { status: 403 })

  const parsed = parseBusinessFields(await request.json())
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const { data, error } = await supabase
    .from("businesses")
    .update(parsed.data)
    .eq("owner_id", user.id)
    .select("id, name, slug")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: "business profile not found" }, { status: 404 })

  return NextResponse.json(data)
}
