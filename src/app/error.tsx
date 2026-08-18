"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="text-4xl mb-4">&#9888;</div>
      <h1 className="text-lg font-bold mb-2">Something went wrong</h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="border border-[var(--fg)] px-4 py-2 text-sm hover:bg-[var(--fg)] hover:text-[var(--bg)]"
      >
        try again
      </button>
    </div>
  )
}
