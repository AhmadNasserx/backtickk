// Mirrors page.tsx: the same header, search, chips, count and grid with the card's real heights, so nothing shifts on load.
export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-10">
      <span className="sr-only">Loading communities</span>
      <div className="flex flex-col gap-3" aria-hidden="true">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-12 w-64 max-w-full rounded-lg sm:h-14" />
        <div className="skeleton h-6 w-96 max-w-full rounded" />
      </div>
      <div className="flex flex-col gap-5" aria-hidden="true">
        <div className="skeleton h-10 w-full max-w-xl rounded-xl" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="skeleton h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>
      <div className="h-4" aria-hidden="true" />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="flex min-w-0">
            <div className="flex h-[14.125rem] w-full flex-col gap-5 rounded-2xl border border-line bg-surface p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="skeleton size-11 shrink-0 rounded-xl" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="skeleton h-7 w-40 max-w-full rounded" />
                  <div className="skeleton h-12 w-full rounded" />
                </div>
              </div>
              <div className="skeleton h-6 w-40 max-w-full rounded-md" />
              <div className="skeleton mt-auto h-8 w-24 rounded-lg" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
