"use client"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-sm">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h1>
        <p className="text-sm text-[var(--muted)] mb-6">{error.message || "An unexpected error occurred."}</p>
        <button onClick={reset} className="pulse-button pulse-button-primary">try again</button>
      </div>
    </main>
  )
}
