export default function Loading() {
  return (
    <main className="pulse-shell">
      <div className="pulse-page-header">
        <div>
          <div className="pulse-skeleton h-3 w-28 mb-3" />
          <div className="pulse-skeleton h-8 w-64 mb-2" />
          <div className="pulse-skeleton h-4 w-80" />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="pulse-card p-4">
            <div className="flex items-start gap-3">
              <div className="pulse-skeleton h-10 w-10 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="pulse-skeleton h-4 w-3/4" />
                <div className="pulse-skeleton h-3 w-1/2" />
                <div className="pulse-skeleton h-3 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
