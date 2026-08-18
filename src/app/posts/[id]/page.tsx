import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getPostById } from "@/lib/supabase/queries"
import PostCard from "@/components/post-card"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  if (!isSupabaseConfigured()) return { title: "Post — Pulse" }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const post = await getPostById(supabase, id, user?.id ?? null)
  return { title: post ? `${post.title} — Pulse` : "Post — Pulse" }
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!isSupabaseConfigured()) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const post = await getPostById(supabase, id, user?.id ?? null)

  if (!post) notFound()

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <PostCard post={post} />
    </main>
  )
}
