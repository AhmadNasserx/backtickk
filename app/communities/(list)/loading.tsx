export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-8">
      <span className="sr-only">Loading communities</span>
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-surface-2" />
      </div>
      <div className="h-10 w-full animate-pulse rounded-lg bg-surface-2" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-8 w-20 animate-pulse rounded-full bg-surface-2" />
        ))}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="h-48 animate-pulse rounded-xl border border-line bg-surface" />
        ))}
      </ul>
    </div>
  );
}
