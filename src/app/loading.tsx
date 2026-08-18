export default function Loading() {
  return (
    <main className="pulse-shell">
      <div className="mb-14 max-w-2xl mx-auto text-center">
        <div className="pulse-skeleton h-3 w-24 mx-auto mb-3" />
        <div className="pulse-skeleton h-8 w-80 mx-auto mb-3" />
        <div className="pulse-skeleton h-4 w-96 mx-auto" />
      </div>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          <div className="space-y-3">
            <div className="pulse-skeleton h-3 w-32" />
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="pulse-card p-3">
                  <div className="pulse-skeleton h-20 w-full mb-2" />
                  <div className="pulse-skeleton h-3 w-3/4" />
                  <div className="pulse-skeleton h-2.5 w-1/2 mt-1" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="pulse-skeleton h-3 w-40" />
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-40 shrink-0">
                  <div className="pulse-card overflow-hidden">
                    <div className="pulse-skeleton h-20 w-full" />
                    <div className="p-2.5 space-y-1.5">
                      <div className="pulse-skeleton h-3 w-3/4" />
                      <div className="pulse-skeleton h-2.5 w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="pulse-skeleton h-3 w-36" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="pulse-card p-4">
                <div className="pulse-skeleton h-3 w-20 mb-2" />
                <div className="pulse-skeleton h-5 w-3/4 mb-1" />
                <div className="pulse-skeleton h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden lg:block space-y-6">
          <div className="pulse-skeleton h-3 w-28" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="pulse-skeleton h-3 w-full" />
          ))}
        </div>
      </div>
    </main>
  )
}
