"use client"

import { useRef, useState } from "react"
import { uploadImage } from "@/lib/upload"
import { useCurrentUser } from "@/lib/supabase/hooks"
import { Upload } from "lucide-react"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  variant?: "avatar" | "logo" | "cover"
  label?: string
}

const MAX_FILE_BYTES = 500 * 1024

function normalizeImageUrl(url: string): string {
  if (!url) return url
  // Convert imgur page/album links to direct image links
  const match = url.match(/imgur\.com\/([a-zA-Z0-9]+)(?:\.\w+)?(?:\/.*)?$/)
  if (match && !url.includes("i.imgur.com")) {
    return `https://i.imgur.com/${match[1]}.jpg`
  }
  return url
}

export default function ImageUpload({ value, onChange, variant = "avatar", label }: ImageUploadProps) {
  const user = useCurrentUser()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [dragging, setDragging] = useState(false)

  const previewClass = variant === "cover"
    ? "w-full h-24 object-cover"
    : variant === "logo"
    ? "w-16 h-16 object-cover"
    : "w-14 h-14 rounded-full object-cover"

  async function handleFile(file: File) {
    if (!user) return
    setError("")

    if (file.size > MAX_FILE_BYTES) {
      setError(`Too large (${(file.size / 1024).toFixed(0)}KB). Max 500KB.`)
      return
    }

    if (!file.type.startsWith("image/")) {
      setError("Images only.")
      return
    }

    setUploading(true)
    try {
      const url = await uploadImage(file, user.id)
      onChange(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "upload failed")
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs text-[var(--muted)]">{label}</label>}

      {/* Drop zone — primary */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative flex items-center justify-center gap-2 border border-dashed px-3 py-4 text-xs text-[var(--dim)] cursor-pointer transition-colors ${
          dragging ? "border-[var(--pulse-accent)] bg-[var(--surface-muted)]" : "border-[var(--hr)] hover:border-[var(--fg)]"
        }`}
      >
        {uploading ? (
          <span>uploading…</span>
        ) : value ? (
          <div className="flex items-center gap-3">
            <img src={value} alt="current" className={`${previewClass} border border-[var(--hr)] object-cover`} />
            <span className="text-[11px]">drop new image or click to replace</span>
          </div>
        ) : (
          <>
            <Upload size={14} strokeWidth={1.75} />
            drop image here or click to upload
          </>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />

      {/* URL fallback */}
      <input
        type="url"
        value={value}
        onChange={(e) => { const normalized = normalizeImageUrl(e.target.value); onChange(normalized); setError("") }}
        onBlur={(e) => { const normalized = normalizeImageUrl(e.target.value); if (normalized !== e.target.value) onChange(normalized) }}
        placeholder="or paste image URL"
        className="w-full text-[11px] text-[var(--muted)] py-1.5"
      />

      {error && <p className="text-[10px] text-[var(--danger)]">{error}</p>}
    </div>
  )
}
