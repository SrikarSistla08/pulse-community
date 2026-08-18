"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import AuthShell from "@/components/auth/auth-shell"
import GoogleButton from "@/components/auth/google-button"
import {
  isSupabaseConfigured,
  resolveRoleHome,
  signInWithPassword,
} from "@/lib/auth-client"

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? ""

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const configured = isSupabaseConfigured()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!configured) {
      setError("Supabase is not configured yet. Add your keys to .env.local")
      return
    }
    setLoading(true)
    setError("")

    const { error } = await signInWithPassword(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const home = await resolveRoleHome()
    router.push(next || home)
    router.refresh()
  }

  if (!configured) {
    return (
      <AuthShell title="PULSE" subtitle="community login">
        <div className="border border-[var(--hr)] p-8 text-center">
          <p className="text-sm font-bold mb-2">Supabase not configured</p>
          <p className="text-xs text-[var(--muted)] mb-4">
            Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local
          </p>
          <Link
            href="/"
            className="text-sm border border-[var(--fg)] px-4 py-2 inline-block hover:bg-[var(--fg)] hover:text-[var(--bg)]"
          >
            &gt; continue to site
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="PULSE" subtitle="community login">
      <form onSubmit={handleSubmit} className="border border-[var(--hr)] p-6 space-y-4">
        {error && (
          <div className="border border-[var(--post-event)] text-[var(--post-event)] text-xs p-2">
            {error}
          </div>
        )}
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1" htmlFor="login-email">
            email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            className="w-full text-sm"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1" htmlFor="login-password">
            password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-sm"
            required
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full border border-[var(--fg)] py-2 text-sm hover:bg-[var(--fg)] hover:text-[var(--bg)] active:bg-[var(--fg)] active:text-[var(--bg)] min-h-[44px] disabled:opacity-50"
        >
          {loading ? "[ ... ]" : "[ log in ]"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-4 text-[10px] text-[var(--dim)] uppercase tracking-wider">
        <span className="flex-1 border-t border-[var(--hr)]" />
        or
        <span className="flex-1 border-t border-[var(--hr)]" />
      </div>

      <GoogleButton />

      <div className="mt-4 text-center text-xs text-[var(--muted)]">
        <p>
          no account?{" "}
          <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline">
            sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
