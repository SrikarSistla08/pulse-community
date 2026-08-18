import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { canManageBusiness } from "@/lib/business-access"
import PostEditForm from "@/components/post-edit-form"

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isSupabaseConfigured()) notFound()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: post } = await supabase
    .from("posts")
    .select("id, business_id, event_id, type, title, content, image_url")
    .eq("id", id)
    .maybeSingle()
  if (!post || !post.business_id || !(await canManageBusiness(supabase, user, post.business_id))) notFound()

  return <PostEditForm post={post} />
}
