// Skeleton mirrors the dashboard layout so the page does not jump when the data arrives.
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your dashboard</span>

      <div className="flex flex-col gap-3">
        <div className="skeleton h-4 w-56 max-w-full rounded-md" />
        <div className="skeleton h-12 w-80 max-w-full rounded-lg sm:h-14" />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="skeleton h-24 rounded-2xl sm:h-24" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
        <div className="flex flex-col gap-5">
          <div className="skeleton h-8 w-40 rounded-md" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
        <div className="flex flex-col gap-8">
          <div className="skeleton h-44 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
