"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase, useCurrentUser } from "@/lib/supabase/hooks"
import { getComments, addComment, deleteComment, toggleCommentLike, relativeTime } from "@/lib/supabase/queries"
import { useToast } from "@/components/toast"
import { Heart } from "lucide-react"
import type { PostComment } from "@/lib/supabase/queries"

export default function CommentThread({ postId, open }: { postId: string; open: boolean }) {
  const router = useRouter()
  const supabase = useSupabase()
  const user = useCurrentUser()
  const { toast } = useToast()
  const [comments, setComments] = useState<PostComment[]>([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!supabase) return
    let active = true
    setLoading(true)
    getComments(supabase, postId, user?.id).then((c) => {
      if (active) { setComments(c); setLoading(false) }
    })
    return () => { active = false }
  }, [supabase, postId, user?.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !supabase) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    if (!text.trim()) return
    setSending(true)
    const comment = await addComment(supabase, user.id, postId, text)
    if (comment) { setComments([...comments, comment]); setText("") }
    setSending(false)
  }

  async function handleDelete(id: string) {
    if (!user || !supabase) return
    await deleteComment(supabase, user.id, id)
    setComments(comments.filter((c) => c.id !== id))
    toast("Comment deleted")
  }

  async function handleLike(comment: PostComment) {
    if (!user || !supabase) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    const wasLiked = comment.likedByUser
    setComments(comments.map((c) =>
      c.id === comment.id
        ? { ...c, likedByUser: !wasLiked, likes: wasLiked ? c.likes - 1 : c.likes + 1 }
        : c
    ))
    const ok = await toggleCommentLike(supabase, user.id, comment.id, wasLiked)
    if (!ok) {
      setComments(comments.map((c) =>
        c.id === comment.id
          ? { ...c, likedByUser: wasLiked, likes: wasLiked ? c.likes + 1 : c.likes - 1 }
          : c
      ))
    }
  }

  if (!open) return null

  return (
    <div className="border-t border-[var(--hr)] pt-3 mt-3">
      {loading ? (
        <div className="pulse-skeleton h-6 w-full" />
      ) : comments.length > 0 ? (
        <div className="space-y-2 mb-3">
          {comments.map((c) => (
            <div key={c.id} className="group flex items-baseline gap-2 text-[12px] leading-snug">
              <span className="font-mono font-semibold text-[10px] uppercase tracking-wider shrink-0">{c.userName}</span>
              <span className="flex-1 text-[var(--fg)]/80">{c.content}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleLike(c)}
                  className={`transition-colors ${c.likedByUser ? "text-[var(--post-event)]" : "text-[var(--dim)] hover:text-[var(--post-event)]"}`}
                >
                  <Heart size={10} strokeWidth={1.5} fill={c.likedByUser ? "currentColor" : "none"} />
                </button>
                <span className="font-mono text-[9px] text-[var(--dim)]">{relativeTime(c.createdAt)}</span>
                {user?.id === c.userId && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-[var(--dim)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                  >
                    x
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex gap-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="write a comment..."
          className="flex-1 text-[11px] px-2 py-1 border border-[var(--hr)] bg-transparent focus:outline-none focus:border-[var(--fg)] font-mono"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="font-mono text-[9px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--fg)] disabled:opacity-30 px-2"
        >
          post
        </button>
      </form>
    </div>
  )
}
