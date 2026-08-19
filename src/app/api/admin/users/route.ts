import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isRole, type Role } from "@/lib/auth"

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  // Only admins can assign roles
  const role = user.user_metadata?.role
  if (!isRole(role) || role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const userId = typeof body.userId === "string" ? body.userId : null
  const newRole = typeof body.role === "string" ? body.role : null

  if (!userId || !newRole) {
    return NextResponse.json({ error: "userId and role are required" }, { status: 400 })
  }

  if (!isRole(newRole)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 })
  }

  // Update profiles table
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Also update auth metadata so middleware picks it up
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { role: newRole },
  })

  return NextResponse.json({ success: true, role: newRole })
}
