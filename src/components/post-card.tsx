"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCurrentUser, useSupabase } from "@/lib/supabase/hooks"
import { relativeTime } from "@/lib/supabase/queries"
import { useToast } from "@/components/toast"
import BusinessImage from "@/components/business-image"
import CommentThread from "@/components/comment-thread"
import { Heart, MessageCircle, Share2, Bookmark, Trash2 } from "lucide-react"
import type { Post } from "@/types"

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
  const [isAdmin, setIsAdmin] = useState(false)
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

  useEffect(() => {
    if (!supabase || !user) return
    supabase
      .from("profiles").select("role").eq("id", user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(data?.role === "admin"))
  }, [supabase, user])

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

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast("Link copied!")
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this post?")) return
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" })
    if (res.ok) {
      toast("Post deleted")
      router.refresh()
    } else {
      toast("Failed to delete")
    }
  }

  return (
    <article className="py-4 px-4 border border-[var(--hr)] mb-4 last:mb-0 bg-[var(--surface)] hover:border-[var(--fg)] transition-colors">
      {/* Author row */}
      <div className="flex items-center gap-2 mb-2">
        <BusinessImage
          name={post.author.name}
          category={post.author.category}
          logoUrl={post.author.logo}
          className="h-5 w-5 object-cover shrink-0"
        />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em]">{post.author.name}</span>
        {post.authorRole && (
          <span className={`font-mono text-[8px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 border ${
            post.authorRole === "business" ? "border-amber-600 text-amber-700" :
            post.authorRole === "organization" ? "border-teal-600 text-teal-700" :
            post.authorRole === "admin" ? "border-[var(--pulse-accent)] text-[var(--pulse-accent)]" :
            "border-[var(--hr)] text-[var(--muted)]"
          }`}>
            {post.authorRole === "business" ? "owner" :
             post.authorRole === "organization" ? "org" :
             post.authorRole === "admin" ? "admin" :
             "community member"}
          </span>
        )}
        <span className="font-mono text-[9px] text-[var(--dim)] uppercase">{relativeTime(post.createdAt)}</span>
      </div>

      {/* Title */}
      <h2 className="font-serif text-xl sm:text-2xl font-bold leading-tight tracking-tight mb-1.5">
        {post.title}
      </h2>

      {/* Content */}
      <p className="text-[13px] leading-relaxed text-[var(--fg)]/75 whitespace-pre-line mb-3">{post.content}</p>

      {/* Image */}
      {post.image && (
        <div className="mb-3 overflow-hidden border border-[var(--hr)]">
          <img src={post.image} alt="" className="block w-full max-h-56 object-cover" />
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--muted)]">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1 transition-colors hover:text-[var(--pulse-accent)] ${liked ? "text-[var(--pulse-accent)]" : ""}`}
        >
          <Heart size={11} strokeWidth={1.5} fill={liked ? "currentColor" : "none"} />
          {likes > 0 && likes}
        </button>
        <button
          onClick={() => setCommentsOpen(!commentsOpen)}
          className={`flex items-center gap-1 transition-colors hover:text-[var(--fg)] ${commentsOpen ? "text-[var(--fg)]" : ""}`}
        >
          <MessageCircle size={11} strokeWidth={1.5} fill={commentsOpen ? "currentColor" : "none"} />
          {post.comments > 0 && post.comments}
        </button>
        <button onClick={handleShare} className="transition-colors hover:text-[var(--fg)]">
          <Share2 size={11} strokeWidth={1.5} />
        </button>
        <button
          onClick={toggleSaved}
          disabled={saving}
          className="transition-colors hover:text-[var(--fg)] disabled:opacity-50"
        >
          <Bookmark size={11} strokeWidth={1.5} fill={saved ? "currentColor" : "none"} />
        </button>
        {post.eventId && (
          <Link href={`/events/${post.eventId}`} className="text-[var(--dim)] hover:text-[var(--fg)] ml-auto">
            event &rarr;
          </Link>
        )}
        {canEdit && (
          <Link href={`/posts/${post.id}/edit`} className="text-[var(--dim)] hover:text-[var(--fg)]">
            edit
          </Link>
        )}
        {isAdmin && (
          <button onClick={handleDelete} className="transition-colors hover:text-red-600 ml-auto">
            <Trash2 size={11} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Comments — only renders when open */}
      <CommentThread postId={post.id} open={commentsOpen} />
    </article>
  )
}
