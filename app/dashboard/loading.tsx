// Skeleton mirrors the dashboard layout so the page does not jump when the data arrives.
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your dashboard</span>
      <div className="flex flex-col gap-2">
        <div className="h-4 w-20 animate-pulse rounded bg-surface-2" />
        <div className="h-8 w-72 max-w-full animate-pulse rounded bg-surface-2" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-line bg-surface" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border border-line bg-surface" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-line bg-surface" />
      </div>
    </div>
  );
}
