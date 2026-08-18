import { createClient } from "@/lib/supabase/server"
import { canManageBusiness } from "@/lib/business-access"
import { POST_TYPES } from "@/lib/posts"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { id } = await params
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("business_id")
    .eq("id", id)
    .maybeSingle()

  if (postError || !post) {
    return NextResponse.json({ error: "post not found" }, { status: 404 })
  }
  if (!post.business_id || !(await canManageBusiness(supabase, user, post.business_id))) {
    return NextResponse.json({ error: "not authorized to edit this post" }, { status: 403 })
  }

  const body = await request.json()
  const { type, title, content } = body
  if (!POST_TYPES.includes(type) || typeof title !== "string" || !title.trim() || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "type, title, and content are required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("posts")
    .update({ type, title: title.trim(), content: content.trim() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("post update failed:", error)
    return NextResponse.json({ error: "We couldn't update this post. Please try again." }, { status: 400 })
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
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("business_id")
    .eq("id", id)
    .maybeSingle()

  if (postError || !post) {
    return NextResponse.json({ error: "post not found" }, { status: 404 })
  }
  if (!post.business_id || !(await canManageBusiness(supabase, user, post.business_id))) {
    return NextResponse.json({ error: "not authorized to delete this post" }, { status: 403 })
  }

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("post deletion failed:", error)
    return NextResponse.json({ error: "We couldn't delete this post. Please try again." }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
