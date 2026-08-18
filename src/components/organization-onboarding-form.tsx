"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

const categories = ["Community", "Nonprofit", "Student Group", "Volunteer", "Education", "Sports", "Arts", "Other"]

export default function OrganizationOnboardingForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    email: "",
    website: "",
    logo_url: "",
    cover_url: "",
    tags: "",
  })
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!form.name.trim()) {
      setError("organization name is required")
      return
    }

    setSubmitting(true)
    const response = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const body = await response.json().catch(() => null)

    if (!response.ok) {
      setError(body?.error ?? "could not create your organization")
      setSubmitting(false)
      return
    }

    router.push("/organization/dashboard")
    router.refresh()
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h1 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
                    set up your organization
        </h1>
        <p className="mt-0.5 text-sm text-[var(--dim)]">Create your community presence on Pulse.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 border border-[var(--hr)] p-4 sm:p-6">
        {error && <p className="border border-[var(--post-event)] p-2 text-xs text-[var(--post-event)]">{error}</p>}

        <fieldset className="space-y-3">
          <legend className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">organization basics</legend>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="org-name">organization name *</label>
            <input id="org-name" value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full text-sm" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="org-category">category</label>
            <select id="org-category" value={form.category} onChange={(e) => update("category", e.target.value)} className="w-full text-sm">
              <option value="">select category</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="org-description">description</label>
            <textarea id="org-description" value={form.description} onChange={(e) => update("description", e.target.value)} className="h-24 w-full resize-none text-sm" placeholder="What does your organization do?" />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">contact and details</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="org-email">email</label>
              <input id="org-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="org-website">website</label>
              <input id="org-website" type="url" placeholder="https://" value={form.website} onChange={(e) => update("website", e.target.value)} className="w-full text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="org-tags">tags</label>
            <input id="org-tags" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="volunteer, community, arbutus" className="w-full text-sm" />
            <p className="mt-1 text-[11px] text-[var(--dim)]">Separate tags with commas.</p>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">optional images</legend>
          <p className="text-[11px] text-[var(--dim)]">Add public image URLs for your logo and cover image.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="org-logo">logo URL</label>
              <input id="org-logo" type="url" placeholder="https://" value={form.logo_url} onChange={(e) => update("logo_url", e.target.value)} className="w-full text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]" htmlFor="org-cover">cover image URL</label>
              <input id="org-cover" type="url" placeholder="https://" value={form.cover_url} onChange={(e) => update("cover_url", e.target.value)} className="w-full text-sm" />
            </div>
          </div>
        </fieldset>

        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="border border-[var(--fg)] px-4 py-2 text-sm hover:bg-[var(--fg)] hover:text-[var(--bg)] disabled:opacity-50">
            {submitting ? "[ creating... ]" : "[ create organization ]"}
          </button>
          <Link href="/" className="border border-[var(--hr)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--hr)]/20">cancel</Link>
        </div>
      </form>
    </main>
  )
}
