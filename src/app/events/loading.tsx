export default function Loading() {
  return (
    <main className="pulse-shell">
      <div className="pulse-page-header">
        <div>
          <div className="pulse-skeleton h-3 w-32 mb-3" />
          <div className="pulse-skeleton h-8 w-72 mb-2" />
          <div className="pulse-skeleton h-4 w-48" />
        </div>
      </div>
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="pulse-skeleton h-9 w-24" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="pulse-card p-4">
            <div className="pulse-skeleton h-24 w-full mb-3" />
            <div className="pulse-skeleton h-3 w-20 mb-1" />
            <div className="pulse-skeleton h-5 w-3/4 mb-1" />
            <div className="pulse-skeleton h-3 w-1/2" />
          </div>
        ))}
      </div>
    </main>
  )
}
