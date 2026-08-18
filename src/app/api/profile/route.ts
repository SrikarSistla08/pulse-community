import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function isValidAvatarUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await request.json()
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : ""
  const avatarUrl = typeof body.avatar_url === "string" ? body.avatar_url.trim() : ""

  if (!fullName) return NextResponse.json({ error: "full name is required" }, { status: 400 })
  if (avatarUrl && !isValidAvatarUrl(avatarUrl)) {
    return NextResponse.json({ error: "avatar URL must start with http:// or https://" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, avatar_url: avatarUrl || null })
    .eq("id", user.id)
    .select("full_name, email, avatar_url, role, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
