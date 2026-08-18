export default function Loading() {
  return (
    <main className="pulse-shell max-w-4xl">
      <div className="pulse-page-header">
        <div>
          <div className="pulse-skeleton h-3 w-32 mb-3" />
          <div className="pulse-skeleton h-8 w-56 mb-2" />
          <div className="pulse-skeleton h-4 w-80" />
        </div>
      </div>
      <div className="pulse-card mb-6 p-5 sm:p-7 flex items-center gap-5">
        <div className="pulse-skeleton h-28 w-28 shrink-0" />
        <div className="space-y-2">
          <div className="pulse-skeleton h-3 w-24" />
          <div className="pulse-skeleton h-6 w-56" />
          <div className="pulse-skeleton h-4 w-72" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="pulse-skeleton h-3 w-40" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="pulse-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="pulse-skeleton h-7 w-7 rounded-full" />
                <div className="space-y-1">
                  <div className="pulse-skeleton h-3 w-28" />
                  <div className="pulse-skeleton h-2.5 w-20" />
                </div>
              </div>
              <div className="pulse-skeleton h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
