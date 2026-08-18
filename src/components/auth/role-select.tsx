"use client"

import type { Role } from "@/lib/auth"

const options: { value: Role; label: string; description: string }[] = [
  { value: "student", label: "Student", description: "Discover local spots, events & volunteer" },
  { value: "business", label: "Business", description: "Own or manage a local business" },
  { value: "organization", label: "Organization", description: "Community & nonprofit organizations" },
]

export default function RoleSelect({
  value,
  onChange,
}: {
  value: Role
  onChange: (role: Role) => void
}) {
  return (
    <fieldset>
      <legend className="text-xs text-[var(--muted)] block mb-2">i am a…</legend>
      <div className="space-y-2">
        {options.map((opt) => {
          const selected = value === opt.value
          return (
            <label
              key={opt.value}
              className={`block border px-3 py-2.5 cursor-pointer ${
                selected ? "border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]" : "border-[var(--hr)] hover:border-[var(--fg)]"
              }`}
            >
              <span className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={selected}
                  onChange={() => onChange(opt.value)}
                  className="mt-0.5 accent-[var(--fg)]"
                />
                <span>
                  <span className="font-bold block leading-tight">{opt.label}</span>
                  <span className={`text-[11px] ${selected ? "text-[var(--bg)]/70" : "text-[var(--muted)]"}`}>
                    {opt.description}
                  </span>
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
