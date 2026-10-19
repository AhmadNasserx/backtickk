// Skeleton with the same structure and heights as the list page, so the content does not shift when it arrives.
export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-10">
      <span className="sr-only">Loading blogs</span>

      <header className="flex flex-col gap-3">
        <div className="skeleton h-3 w-44 rounded" />
        <div className="skeleton h-14 w-48 rounded-lg sm:h-16" />
        <div className="skeleton h-4 w-72 max-w-full rounded" />
      </header>

      <section aria-hidden="true" className="flex flex-col gap-4">
        <div className="skeleton h-11 w-full rounded-lg sm:h-10" />
        <div className="-mx-4 flex gap-2 overflow-hidden px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="skeleton h-10 w-24 shrink-0 rounded-full sm:h-9" />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="skeleton h-[4.25rem] min-w-[11rem] flex-1 rounded-lg sm:w-56 sm:flex-none" />
          <div className="skeleton h-[4.25rem] min-w-[9rem] flex-1 rounded-lg sm:w-44 sm:flex-none" />
        </div>
      </section>

      <div className="flex flex-col gap-5">
        <div className="skeleton h-3 w-24 rounded" />
        <ul aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="skeleton aspect-video w-full rounded-none" />
              <div className="flex flex-col gap-3.5 p-5 sm:p-6">
                <div className="skeleton h-3 w-44 rounded" />
                <div className="skeleton h-7 w-4/5 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-2/3 rounded" />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="skeleton h-6 w-32 rounded-full" />
                  <div className="skeleton h-5 w-20 rounded-md" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
