export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-12">
      <span className="sr-only">Loading profile</span>
      <div className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:p-8">
        <div className="size-16 shrink-0 animate-pulse rounded-full bg-surface-2" />
        <div className="flex flex-1 flex-col gap-3">
          <div className="h-8 w-56 max-w-full animate-pulse rounded-lg bg-surface-2" />
          <div className="h-4 w-32 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-surface-2" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl border border-line bg-surface" />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-xl border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
