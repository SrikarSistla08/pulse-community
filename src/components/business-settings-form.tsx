"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import BusinessImage from "@/components/business-image"

const categories = ["Restaurant", "Cafe", "Retail", "Services", "Entertainment", "Fitness", "Other"]

interface BusinessSettings {
  id: string
  name: string
  category: string
  description: string | null
  location: string
  phone: string | null
  email: string | null
  website: string | null
  hours: string | null
  tags: string[] | null
  logo_url: string | null
  cover_url: string | null
  student_discount: boolean
}

export default function BusinessSettingsForm({ business }: { business: BusinessSettings }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: business.name,
    category: business.category,
    location: business.location,
    description: business.description ?? "",
    phone: business.phone ?? "",
    email: business.email ?? "",
    website: business.website ?? "",
    hours: business.hours ?? "",
    tags: (business.tags ?? []).join(", "),
    logo_url: business.logo_url ?? "",
    cover_url: business.cover_url ?? "",
    student_discount: business.student_discount,
  })
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("")
    setError("")
    if (!form.name.trim() || !form.category || !form.location.trim()) {
      setError("business name, category, and location are required")
      return
    }

    setSaving(true)
    const response = await fetch("/api/businesses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const body = await response.json().catch(() => null)
    setSaving(false)

    if (!response.ok) {
      setError(body?.error ?? "could not save changes")
      return
    }
    setStatus("Changes saved.")
    router.refresh()
  }

  return (
    <main className="pulse-shell max-w-4xl">
      <div className="pulse-page-header">
        <div>
          <p className="pulse-kicker">business studio</p>
          <h1 className="pulse-title">Edit your presence.</h1>
          <p className="pulse-lede">Keep the details your community sees clear, current, and useful.</p>
        </div>
        <Link href={`/businesses/${business.id}`} className="pulse-button">view public profile</Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        {(error || status) && <p className={`rounded-sm border p-3 text-sm ${error ? "border-[var(--post-event)] text-[var(--post-event)]" : "border-[var(--success)] text-[var(--success)]"}`}>{error || status}</p>}

        <section className="pulse-card overflow-hidden">
          <BusinessImage name={form.name || business.name} category={form.category || business.category} logoUrl={form.logo_url} coverUrl={form.cover_url} variant="cover" className="h-32 w-full object-cover sm:h-44" />
          <div className="relative p-5 sm:p-6">
            <BusinessImage name={form.name || business.name} category={form.category || business.category} logoUrl={form.logo_url} coverUrl={form.cover_url} className="-mt-12 h-20 w-20 object-cover" />
            <p className="mt-3 text-xs text-[var(--muted)]">Preview updates as you edit your image URLs.</p>
          </div>
        </section>

        <fieldset className="pulse-card space-y-4 p-5 sm:p-6">
          <legend className="pulse-kicker">business identity</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="settings-name">business name *</label>
              <input id="settings-name" value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full text-sm" required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="settings-category">category *</label>
              <select id="settings-category" value={form.category} onChange={(e) => update("category", e.target.value)} className="w-full text-sm" required>
                <option value="">select category</option>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="settings-description">description</label>
            <textarea id="settings-description" value={form.description} onChange={(e) => update("description", e.target.value)} className="h-24 w-full resize-none text-sm" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="settings-logo">logo URL</label>
              <input id="settings-logo" type="url" placeholder="https://" value={form.logo_url} onChange={(e) => update("logo_url", e.target.value)} className="w-full text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="settings-cover">cover image URL</label>
              <input id="settings-cover" type="url" placeholder="https://" value={form.cover_url} onChange={(e) => update("cover_url", e.target.value)} className="w-full text-sm" />
            </div>
          </div>
        </fieldset>

        <fieldset className="pulse-card space-y-3 p-5 sm:p-6">
          <legend className="pulse-kicker">location</legend>
          <input id="settings-location" aria-label="Location" value={form.location} onChange={(e) => update("location", e.target.value)} className="w-full text-sm" required />
        </fieldset>

        <fieldset className="pulse-card space-y-3 p-5 sm:p-6">
          <legend className="pulse-kicker">contact</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="tel" aria-label="Phone" placeholder="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full text-sm" />
            <input type="email" aria-label="Email" placeholder="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full text-sm" />
          </div>
          <input type="url" aria-label="Website" placeholder="https://website.com" value={form.website} onChange={(e) => update("website", e.target.value)} className="w-full text-sm" />
        </fieldset>

        <fieldset className="pulse-card space-y-3 p-5 sm:p-6">
          <legend className="pulse-kicker">operating information</legend>
          <input aria-label="Hours" placeholder="Mon–Fri 9am–6pm" value={form.hours} onChange={(e) => update("hours", e.target.value)} className="w-full text-sm" />
        </fieldset>

        <fieldset className="pulse-card space-y-3 p-5 sm:p-6">
          <legend className="pulse-kicker">community</legend>
          <input aria-label="Tags" placeholder="coffee, local, study spot" value={form.tags} onChange={(e) => update("tags", e.target.value)} className="w-full text-sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.student_discount} onChange={(e) => update("student_discount", e.target.checked)} />
            offers a student discount
          </label>
        </fieldset>

        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className="pulse-button pulse-button-primary disabled:opacity-50">
            {saving ? "[ saving... ]" : "[ save changes ]"}
          </button>
          <Link href="/business/dashboard" className="pulse-button">cancel</Link>
        </div>
      </form>
    </main>
  )
}
