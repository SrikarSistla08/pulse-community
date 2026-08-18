"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase, useCurrentUser } from "@/lib/supabase/hooks"
import { getComments, addComment, deleteComment, relativeTime } from "@/lib/supabase/queries"
import { useToast } from "@/components/toast"
import type { PostComment } from "@/lib/supabase/queries"

export default function CommentThread({ postId }: { postId: string }) {
  const router = useRouter()
  const supabase = useSupabase()
  const user = useCurrentUser()
  const { toast } = useToast()
  const [comments, setComments] = useState<PostComment[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!supabase || !open) return
    let active = true
    getComments(supabase, postId).then((c) => {
      if (active) {
        setComments(c)
        setLoading(false)
      }
    })
    return () => { active = false }
  }, [supabase, postId, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !supabase) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    if (!text.trim()) return
    setSending(true)
    const comment = await addComment(supabase, user.id, postId, text)
    if (comment) {
      setComments([...comments, comment])
      setText("")
    }
    setSending(false)
  }

  async function handleDelete(id: string) {
    if (!user || !supabase) return
    await deleteComment(supabase, user.id, id)
    setComments(comments.filter((c) => c.id !== id))
    toast("Comment deleted")
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-[10px] text-[var(--muted)] hover:underline"
      >
        {open ? "hide comments" : `comments (${comments.length})`}
      </button>
      {open && (
        <div className="mt-2 border-t border-[var(--hr)] pt-2">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="pulse-skeleton h-8 w-full" />
              ))}
            </div>
          ) : (
            <>
              {comments.length === 0 && (
                <p className="text-[10px] text-[var(--dim)] mb-2">no comments yet</p>
              )}
              <div className="space-y-2 mb-2">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2 text-xs">
                    <span className="font-bold shrink-0">{c.userName}</span>
                    <span className="flex-1 text-[var(--fg)]">{c.content}</span>
                    <span className="text-[var(--dim)] shrink-0">{relativeTime(c.createdAt)}</span>
                    {user?.id === c.userId && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-[var(--dim)] hover:text-[var(--danger)] shrink-0"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="flex gap-1">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="add a comment…"
                  className="flex-1 text-xs px-2 py-1 border border-[var(--hr)] bg-[var(--surface)] focus:outline-none focus:border-[var(--fg)]"
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="text-[10px] border border-[var(--fg)] px-2 py-1 hover:bg-[var(--fg)] hover:text-[var(--bg)] disabled:opacity-40"
                >
                  post
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}
