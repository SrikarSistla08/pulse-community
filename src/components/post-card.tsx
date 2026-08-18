"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCurrentUser, useSupabase } from "@/lib/supabase/hooks"
import { relativeTime } from "@/lib/supabase/queries"
import { useToast } from "@/components/toast"
import BusinessImage from "@/components/business-image"
import CommentThread from "@/components/comment-thread"
import type { Post } from "@/types"

const typeStyle: Record<Post["type"], { label: string; color: string }> = {
  announcement: { label: "announcement", color: "var(--post-announcement)" },
  event: { label: "event", color: "var(--post-event)" },
  promotion: { label: "promotion", color: "var(--post-promotion)" },
  update: { label: "community update", color: "var(--post-update)" },
  volunteer: { label: "volunteer", color: "var(--post-volunteer)" },
  hiring: { label: "hiring", color: "var(--post-hiring)" },
}

export default function PostCard({ post }: { post: Post }) {
  const t = typeStyle[post.type]
  const router = useRouter()
  const supabase = useSupabase()
  const user = useCurrentUser()
  const { toast } = useToast()
  const [likes, setLikes] = useState(post.likes)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    if (!supabase || !user) return
    let active = true
    Promise.all([
      supabase
        .from("saved_posts")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", post.id)
        .maybeSingle(),
      supabase
        .from("post_likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", post.id)
        .maybeSingle(),
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
      .from("businesses")
      .select("id")
      .eq("id", post.businessId)
      .eq("owner_id", user.id)
      .maybeSingle()
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
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", post.id)
      if (error) {
        setLiked(prevLiked)
        setLikes(prevCount)
      }
    } else {
      const { error } = await supabase
        .from("post_likes")
        .insert({ user_id: user.id, post_id: post.id })
      if (error) {
        setLiked(prevLiked)
        setLikes(prevCount)
      }
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
    <article
      className="pulse-card border-l-[3px] p-4 sm:p-5"
      style={{ borderLeftColor: t.color }}
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: t.color, borderColor: t.color }}
        >
          {t.label}
        </span>
        <BusinessImage name={post.author.name} category={post.author.category} logoUrl={post.author.logo} className="h-6 w-6 border border-[var(--fg)] object-cover duotone" />
        <div className="text-xs text-[var(--muted)]">
          <span className="font-bold text-[var(--fg)]">{post.author.name}</span>
          {" — "}
          <span>{relativeTime(post.createdAt)}</span>
        </div>
      </div>

        <h2 className="mb-1 text-lg font-bold leading-snug tracking-tight">{post.title}</h2>

      <p className="mb-3 max-w-2xl text-[15px] leading-relaxed text-[var(--fg)] whitespace-pre-line">
        {post.content}
      </p>

      {post.image && (
        <div className="mb-2 inline-block max-w-full duotone">
          <img
            src={post.image}
            alt=""
            className="block max-w-full h-auto object-cover border border-[var(--hr)]"
            style={{ maxHeight: 220 }}
          />
        </div>
      )}

      <div className="flex items-center gap-3 sm:gap-4 text-sm text-[var(--muted)] mt-2 flex-wrap">
        <button
          onClick={toggleLike}
          className={`hover:underline ${liked ? "text-[var(--post-event)]" : ""}`}
        >
          &#9829; {likes}
        </button>
        <button onClick={() => {}} className="hover:underline">
          &#9993; {post.comments}
        </button>
        <button onClick={handleShare} className="hover:underline">
          &#8627; share
        </button>
        <button
          onClick={toggleSaved}
          disabled={saving}
          className="hover:underline disabled:opacity-50"
        >
          {saved ? "* saved" : "* save"}
        </button>
        {post.eventId && (
          <Link href={`/events/${post.eventId}`} className="hover:underline">
            &rarr; event details
          </Link>
        )}
        {canEdit && (
          <Link href={`/posts/${post.id}/edit`} className="hover:underline">
            edit
          </Link>
        )}
      </div>
      <CommentThread postId={post.id} />
    </article>
  )
}
