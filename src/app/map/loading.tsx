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
      <div className="pulse-card h-[600px] flex items-center justify-center">
        <div className="pulse-skeleton h-full w-full" />
      </div>
    </main>
  )
}
