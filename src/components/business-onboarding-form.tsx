"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

const categories = ["Restaurant", "Cafe", "Retail", "Services", "Entertainment", "Fitness", "Other"]

export default function BusinessOnboardingForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    category: "",
    location: "",
    description: "",
    phone: "",
    email: "",
    website: "",
    hours: "",
    tags: "",
    logo_url: "",
    cover_url: "",
    student_discount: false,
  })
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!form.name.trim() || !form.category || !form.location.trim()) {
      setError("business name, category, and location are required")
      return
    }

    setSubmitting(true)
    const response = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const body = await response.json().catch(() => null)

    if (!response.ok) {
      setError(body?.error ?? "could not create your business profile")
      setSubmitting(false)
      return
    }

    router.push("/business/dashboard")
    router.refresh()
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h1 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
                    set up your business
        </h1>
        <p className="mt-0.5 text-sm text-[var(--dim)]">Create your community presence on Pulse.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 border border-[var(--hr)] p-4 sm:p-6">
        {error && <p className="border border-[var(--post-event)] p-2 text-xs text-[var(--post-event)]">{error}</p>}

        <fieldset className="space-y-3">
          <legend className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">business basics</legend>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="business-name">business name *</label>
            <input id="business-name" value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full text-sm" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="business-category">category *</label>
              <select id="business-category" value={form.category} onChange={(e) => update("category", e.target.value)} className="w-full text-sm" required>
                <option value="">select category</option>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="business-location">location *</label>
              <input id="business-location" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="address or neighborhood" className="w-full text-sm" required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="business-description">description</label>
            <textarea id="business-description" value={form.description} onChange={(e) => update("description", e.target.value)} className="h-24 w-full resize-none text-sm" />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">contact and details</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="business-phone">phone</label>
              <input id="business-phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="business-email">email</label>
              <input id="business-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full text-sm" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="business-website">website</label>
              <input id="business-website" type="url" placeholder="https://" value={form.website} onChange={(e) => update("website", e.target.value)} className="w-full text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="business-hours">hours</label>
              <input id="business-hours" value={form.hours} onChange={(e) => update("hours", e.target.value)} placeholder="Mon–Fri 9am–6pm" className="w-full text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="business-tags">tags</label>
            <input id="business-tags" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="coffee, local, study spot" className="w-full text-sm" />
            <p className="mt-1 text-[11px] text-[var(--dim)]">Separate tags with commas.</p>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">optional images</legend>
          <p className="text-[11px] text-[var(--dim)]">Add public image URLs for your logo and cover image.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="business-logo">logo URL</label>
              <input id="business-logo" type="url" placeholder="https://" value={form.logo_url} onChange={(e) => update("logo_url", e.target.value)} className="w-full text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="business-cover">cover image URL</label>
              <input id="business-cover" type="url" placeholder="https://" value={form.cover_url} onChange={(e) => update("cover_url", e.target.value)} className="w-full text-sm" />
            </div>
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.student_discount} onChange={(e) => update("student_discount", e.target.checked)} />
          offers a student discount
        </label>

        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="border border-[var(--fg)] px-4 py-2 text-sm hover:bg-[var(--fg)] hover:text-[var(--bg)] disabled:opacity-50">
            {submitting ? "[ creating... ]" : "[ create business ]"}
          </button>
          <Link href="/" className="border border-[var(--hr)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--hr)]/20">cancel</Link>
        </div>
      </form>
    </main>
  )
}
