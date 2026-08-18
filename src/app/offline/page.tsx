export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-sm">
        <div className="text-4xl mb-4">&#128246;</div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">You&apos;re offline</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          Pulse needs an internet connection to show you what&apos;s happening around you.
          Check your connection and try again.
        </p>
        <a
          href="/"
          className="pulse-button pulse-button-primary inline-block"
        >
          try again
        </a>
      </div>
    </main>
  )
}
