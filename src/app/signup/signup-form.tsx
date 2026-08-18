"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import AuthShell from "@/components/auth/auth-shell"
import GoogleButton from "@/components/auth/google-button"
import RoleSelect from "@/components/auth/role-select"
import { isSupabaseConfigured, signUpWithPassword } from "@/lib/auth-client"
import { homeForRole, type Role } from "@/lib/auth"
import { resolveRoleHome } from "@/lib/auth-client"

export default function SignupForm() {
  const router = useRouter()
  const [next] = useState(
    () =>
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next") ?? ""
        : ""
  )

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("student")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmSent, setConfirmSent] = useState(false)

  const configured = isSupabaseConfigured()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!configured) {
      setError("Supabase is not configured yet. Add your keys to .env.local")
      return
    }
    setLoading(true)
    setError("")

    const { error, needsConfirmation, user } = await signUpWithPassword({
      fullName,
      email,
      password,
      role,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }

    if (needsConfirmation || !user) {
      setConfirmSent(true)
      return
    }

    router.push(next || await resolveRoleHome())
    router.refresh()
  }

  if (!configured) {
    return (
      <AuthShell title="PULSE" subtitle="community signup">
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

  if (confirmSent) {
    return (
      <AuthShell title="PULSE" subtitle="community signup">
        <div className="border border-[var(--hr)] p-8 text-center">
          <p className="text-sm font-bold mb-2">&#9993; check your email</p>
          <p className="text-xs text-[var(--muted)] mb-4">
            We sent a confirmation link to <span className="font-bold">{email}</span>.
            <br />
            Once confirmed you&apos;ll be redirected to{" "}
            <span className="font-bold">{homeForRole(role)}</span> as a {role}.
          </p>
          <Link
            href="/login"
            className="text-sm border border-[var(--fg)] px-4 py-2 inline-block hover:bg-[var(--fg)] hover:text-[var(--bg)]"
          >
            &gt; go to login
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="PULSE" subtitle="join the community">
      <form onSubmit={handleSubmit} className="border border-[var(--hr)] p-6 space-y-4">
        {error && (
          <div className="border border-[var(--post-event)] text-[var(--post-event)] text-xs p-2">
            {error}
          </div>
        )}
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1" htmlFor="signup-name">
            full name
          </label>
          <input
            id="signup-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ada Lovelace"
            className="w-full text-sm"
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1" htmlFor="signup-email">
            email
          </label>
          <input
            id="signup-email"
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
          <label className="text-xs text-[var(--muted)] block mb-1" htmlFor="signup-password">
            password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="min 6 characters"
            className="w-full text-sm"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <RoleSelect value={role} onChange={setRole} />

        <button
          type="submit"
          disabled={loading}
          className="w-full border border-[var(--fg)] py-2 text-sm hover:bg-[var(--fg)] hover:text-[var(--bg)] active:bg-[var(--fg)] active:text-[var(--bg)] min-h-[44px] disabled:opacity-50"
        >
          {loading ? "[ ... ]" : "[ create account ]"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-4 text-[10px] text-[var(--dim)] uppercase tracking-wider">
        <span className="flex-1 border-t border-[var(--hr)]" />
        or
        <span className="flex-1 border-t border-[var(--hr)]" />
      </div>

      <GoogleButton label="Continue with Google" />

      <div className="mt-4 text-center text-xs text-[var(--muted)]">
        <p>
          already have an account?{" "}
          <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline">
            log in
          </Link>
        </p>
        <p className="mt-1 text-[11px] text-[var(--dim)]">
          admin accounts are assigned manually
        </p>
      </div>
    </AuthShell>
  )
}
