"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { POST_TYPES, postTypeLabels, type PostType } from "@/lib/posts"

type EditablePost = {
  id: string
  business_id: string
  event_id: string | null
  type: PostType
  title: string
  content: string
  image_url: string | null
}

export default function PostEditForm({ post }: { post: EditablePost }) {
  const router = useRouter()
  const [type, setType] = useState<PostType>(post.type)
  const [title, setTitle] = useState(post.title)
  const [content, setContent] = useState(post.content)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, content }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        setError(body?.error ?? "We couldn't update this post. Please try again.")
        return
      }
      setSuccess("Post updated.")
      router.refresh()
    } catch {
      setError("We couldn't update this post. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-5 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">edit post</h1>
      <form onSubmit={save} className="space-y-4 border border-[var(--hr)] p-4 sm:p-6">
        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">type</label>
          <select value={type} onChange={(e) => setType(e.target.value as PostType)} className="w-full text-sm">
            {POST_TYPES.map((value) => <option key={value} value={value}>{postTypeLabels[value]}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-sm" required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">message</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} className="h-32 w-full resize-none text-sm" required />
        </div>
        {error && <p className="text-xs text-[var(--post-event)]">{error}</p>}
        {success && <p className="text-xs text-[var(--post-update)]">{success}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="border border-[var(--fg)] px-4 py-2 text-sm hover:bg-[var(--fg)] hover:text-[var(--bg)] disabled:opacity-50">
            {saving ? "[ saving... ]" : "[ save changes ]"}
          </button>
          <button type="button" onClick={() => router.back()} className="border border-[var(--hr)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--hr)]/20">[ cancel ]</button>
        </div>
      </form>
    </div>
  )
}
