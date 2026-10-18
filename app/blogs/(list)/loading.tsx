export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-8">
      <span className="sr-only">Loading blogs</span>
      <div className="flex flex-col gap-2">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-surface-2" />
      </div>
      <div className="h-10 w-full animate-pulse rounded-lg bg-surface-2" />
      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-10 w-44 animate-pulse rounded-lg bg-surface-2" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-xl border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
