"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

interface ProfileEditorProps {
  fullName: string
  avatarUrl: string
  email: string
}

function initials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join("") || "?"
}

export default function ProfileEditor({ fullName, avatarUrl, email }: ProfileEditorProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(fullName)
  const [avatar, setAvatar] = useState(avatarUrl)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [saving, setSaving] = useState(false)

  async function save() {
    setError("")
    setStatus("")
    setSaving(true)
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: name, avatar_url: avatar }),
    })
    const body = await response.json().catch(() => null)
    setSaving(false)
    if (!response.ok) {
      setError(body?.error ?? "could not save profile")
      return
    }
    setStatus("Changes saved.")
    setEditing(false)
    router.refresh()
  }

  const showAvatar = avatar && !avatarFailed

  return (
    <div>
      <div className="flex items-start gap-4">
        {showAvatar ? (
          <img
            src={avatar}
            alt="Profile"
            className="h-24 w-24 object-cover duotone rounded-md"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <div className="h-24 w-24 bg-[var(--surface-muted)] flex items-center justify-center text-2xl font-bold text-[var(--fg)] rounded-md">
            {initials(fullName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-lg font-bold">{fullName}</h1>
          <p className="text-xs text-[var(--muted)]">{email}</p>
          <button onClick={() => setEditing(!editing)} className="pulse-button pulse-button-quiet mt-2 text-xs">
            {editing ? "cancel edit" : "edit profile"}
          </button>
        </div>
      </div>

      {status && <p className="mt-3 text-xs text-[var(--post-volunteer)]">{status}</p>}
      {editing && (
        <div className="mt-4 space-y-3 border-t border-[var(--hr)] pt-4">
          {error && <p className="border border-[var(--post-event)] p-2 text-xs text-[var(--post-event)]">{error}</p>}
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="account-full-name">full name</label>
            <input id="account-full-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="account-avatar-url">avatar URL (optional)</label>
            <input id="account-avatar-url" type="url" value={avatar} onChange={(e) => { setAvatar(e.target.value); setAvatarFailed(false) }} placeholder="https://example.com/photo.jpg" className="w-full text-sm" />
            <p className="text-[10px] text-[var(--dim)] mt-1">Paste a direct image URL (ends in .jpg, .png, etc.)</p>
          </div>
          <p className="text-[11px] text-[var(--dim)]">Email and role are managed by authentication and admin controls.</p>
          <button onClick={save} disabled={saving} className="border border-[var(--fg)] px-3 py-2 text-xs hover:bg-[var(--fg)] hover:text-[var(--bg)] disabled:opacity-50">
            {saving ? "[ saving... ]" : "[ save profile ]"}
          </button>
        </div>
      )}
    </div>
  )
}
