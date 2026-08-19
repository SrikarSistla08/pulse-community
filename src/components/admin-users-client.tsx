"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Role } from "@/lib/auth"
import { relativeTime } from "@/lib/supabase/queries"

const ROLES: Role[] = ["student", "business", "organization", "admin"]
const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  business: "Business",
  organization: "Organization",
  admin: "Admin",
}

interface User {
  id: string
  full_name: string | null
  email: string | null
  role: string
  created_at: string
}

export default function AdminUsersClient({ users: initialUsers }: { users: User[] }) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [filter, setFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)

  const filtered = users.filter((u) => {
    if (filter !== "all" && u.role !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      )
    }
    return true
  })

  async function updateRole(userId: string, newRole: Role) {
    setUpdating(userId)
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    })
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
    }
    setUpdating(null)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h1 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
          / manage users
        </h1>
        <p className="text-xs text-[var(--dim)] mt-0.5">assign roles and manage community access</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1">
          {["all", ...ROLES].map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-2.5 py-1 text-[11px] border transition-colors ${
                filter === r
                  ? "border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]"
                  : "border-[var(--hr)] hover:border-[var(--fg)]"
              }`}
            >
              {r === "all" ? "all" : ROLE_LABELS[r as Role]}
              {r !== "all" && (
                <span className="ml-1 text-[var(--dim)]">
                  ({users.filter((u) => u.role === r).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search name or email..."
          className="text-xs px-2.5 py-1.5 border border-[var(--hr)] bg-transparent focus:outline-none focus:border-[var(--fg)] w-56"
        />
      </div>

      {/* User list */}
      <div className="border border-[var(--hr)] divide-y divide-[var(--hr)]">
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-xs text-[var(--dim)] text-center">no users found.</p>
        )}
        {filtered.map((user) => (
          <div key={user.id} className="flex items-center gap-4 px-4 py-3 text-xs">
            <div className="min-w-0 flex-1">
              <p className="font-bold truncate">{user.full_name || "Unnamed"}</p>
              <p className="text-[var(--dim)] truncate">{user.email}</p>
            </div>
            <span className="text-[var(--dim)] shrink-0">{relativeTime(user.created_at)}</span>
            <div className="shrink-0">
              <select
                value={user.role}
                onChange={(e) => updateRole(user.id, e.target.value as Role)}
                disabled={updating === user.id}
                className="text-[11px] border border-[var(--hr)] px-2 py-1 bg-transparent focus:outline-none focus:border-[var(--fg)] disabled:opacity-50"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[10px] text-[var(--dim)]">
        {filtered.length} user{filtered.length !== 1 ? "s" : ""}
      </p>
    </div>
  )
}
