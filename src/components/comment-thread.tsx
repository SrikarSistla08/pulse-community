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

  return (
    <div className="mt-2">
      {open && (
        <div className="space-y-1">
          {loading ? (
            <div className="pulse-skeleton h-6 w-full" />
          ) : (
            comments.map((c) => (
              <div key={c.id} className="group flex items-baseline gap-2 text-[12px] leading-snug">
                <span className="font-semibold shrink-0">{c.userName}</span>
                <span className="flex-1 text-[var(--fg)]/80">{c.content}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleLike(c)}
                    className={`transition-colors ${c.likedByUser ? "text-[var(--post-event)]" : "text-[var(--dim)] hover:text-[var(--post-event)]"}`}
                  >
                    <Heart size={10} strokeWidth={1.5} fill={c.likedByUser ? "currentColor" : "none"} />
                  </button>
                  <span className="text-[10px] text-[var(--dim)]">{relativeTime(c.createdAt)}</span>
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
            ))
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-1 mt-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="comment..."
          className="flex-1 text-[12px] px-2 py-1 border border-[var(--hr)] bg-transparent focus:outline-none focus:border-[var(--fg)]"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="text-[10px] text-[var(--muted)] hover:text-[var(--fg)] disabled:opacity-30 px-1"
        >
          post
        </button>
      </form>
    </div>
  )
}
