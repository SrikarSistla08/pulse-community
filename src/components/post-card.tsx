"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCurrentUser, useSupabase } from "@/lib/supabase/hooks"
import { relativeTime } from "@/lib/supabase/queries"
import { useToast } from "@/components/toast"
import BusinessImage from "@/components/business-image"
import CommentThread from "@/components/comment-thread"
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react"
import type { Post } from "@/types"

const typeColor: Record<Post["type"], string> = {
  announcement: "var(--post-announcement)",
  event: "var(--post-event)",
  promotion: "var(--post-promotion)",
  update: "var(--post-update)",
  volunteer: "var(--post-volunteer)",
  hiring: "var(--post-hiring)",
}

export default function PostCard({ post }: { post: Post }) {
  const router = useRouter()
  const supabase = useSupabase()
  const user = useCurrentUser()
  const { toast } = useToast()
  const [likes, setLikes] = useState(post.likes)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)

  useEffect(() => {
    if (!supabase || !user) return
    let active = true
    Promise.all([
      supabase.from("saved_posts").select("id").eq("user_id", user.id).eq("post_id", post.id).maybeSingle(),
      supabase.from("post_likes").select("id").eq("user_id", user.id).eq("post_id", post.id).maybeSingle(),
    ]).then(([savedRes, likeRes]) => {
      if (!active) return
      setSaved(Boolean(savedRes.data))
      setLiked(Boolean(likeRes.data))
    })
    return () => { active = false }
  }, [supabase, user, post.id])

  useEffect(() => {
    if (!supabase || !user || !post.businessId) return
    supabase
      .from("businesses").select("id").eq("id", post.businessId).eq("owner_id", user.id).maybeSingle()
      .then(({ data }) => setCanEdit(Boolean(data)))
  }, [supabase, user, post.businessId])

  async function toggleLike() {
    if (!user || !supabase) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    const prevLiked = liked
    const prevCount = likes
    setLiked(!prevLiked)
    setLikes(prevLiked ? prevCount - 1 : prevCount + 1)
    if (prevLiked) {
      const { error } = await supabase.from("post_likes").delete().eq("user_id", user.id).eq("post_id", post.id)
      if (error) { setLiked(prevLiked); setLikes(prevCount) }
    } else {
      const { error } = await supabase.from("post_likes").insert({ user_id: user.id, post_id: post.id })
      if (error) { setLiked(prevLiked); setLikes(prevCount) }
    }
  }

  async function toggleSaved() {
    if (!user || !supabase) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setSaving(true)
    const result = saved
      ? await supabase.from("saved_posts").delete().eq("user_id", user.id).eq("post_id", post.id)
      : await supabase.from("saved_posts").insert({ user_id: user.id, post_id: post.id })
    if (!result.error) {
      setSaved(!saved)
      toast(saved ? "Removed from saved" : "Saved!")
    }
    setSaving(false)
  }

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast("Link copied!")
    }
  }

  return (
    <article className="py-4 border-b border-[var(--hr)] last:border-0">
      {/* Author row */}
      <div className="flex items-center gap-2 mb-2">
        <BusinessImage
          name={post.author.name}
          category={post.author.category}
          logoUrl={post.author.logo}
          className="h-7 w-7 rounded-full object-cover duotone shrink-0"
        />
        <span className="text-[13px] font-semibold">{post.author.name}</span>
        <span className="text-[11px] text-[var(--dim)]">{relativeTime(post.createdAt)}</span>
        <span
          className="ml-auto text-[9px] font-medium uppercase tracking-wider"
          style={{ color: typeColor[post.type] }}
        >
          {post.type === "update" ? "update" : post.type}
        </span>
      </div>

      {/* Title + content */}
      <h2 className="text-[15px] font-bold leading-snug tracking-tight mb-1">{post.title}</h2>
      <p className="text-[13px] leading-relaxed text-[var(--fg)]/80 whitespace-pre-line mb-2">{post.content}</p>

      {post.image && (
        <div className="mb-2 overflow-hidden">
          <img src={post.image} alt="" className="block w-full max-h-56 object-cover" />
        </div>
      )}

      {/* Compact action bar */}
      <div className="flex items-center gap-3 text-[var(--muted)]">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1 text-[11px] transition-colors hover:text-[var(--post-event)] ${liked ? "text-[var(--post-event)]" : ""}`}
        >
          <Heart size={12} strokeWidth={1.5} fill={liked ? "currentColor" : "none"} />
          {likes > 0 && likes}
        </button>
        <button
          onClick={() => setCommentsOpen(!commentsOpen)}
          className={`flex items-center gap-1 text-[11px] transition-colors hover:text-[var(--fg)] ${commentsOpen ? "text-[var(--fg)]" : "text-[var(--muted)]"}`}
        >
          <MessageCircle size={12} strokeWidth={1.5} fill={commentsOpen ? "currentColor" : "none"} />
          {post.comments > 0 && post.comments}
        </button>
        <button onClick={handleShare} className="text-[11px] transition-colors hover:text-[var(--fg)]">
          <Share2 size={12} strokeWidth={1.5} />
        </button>
        <button
          onClick={toggleSaved}
          disabled={saving}
          className="transition-colors hover:text-[var(--fg)] disabled:opacity-50"
        >
          <Bookmark size={12} strokeWidth={1.5} fill={saved ? "currentColor" : "none"} />
        </button>
        {post.eventId && (
          <Link href={`/events/${post.eventId}`} className="text-[11px] text-[var(--dim)] hover:text-[var(--fg)] ml-auto">
            event &rarr;
          </Link>
        )}
        {canEdit && (
          <Link href={`/posts/${post.id}/edit`} className="text-[11px] text-[var(--dim)] hover:text-[var(--fg)]">
            edit
          </Link>
        )}
      </div>

      <CommentThread postId={post.id} open={commentsOpen} />
    </article>
  )
}
