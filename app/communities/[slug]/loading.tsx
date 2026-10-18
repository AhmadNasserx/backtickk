export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-10">
      <span className="sr-only">Loading community</span>
      <div className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex items-start gap-5">
          <div className="size-16 shrink-0 animate-pulse rounded-xl bg-surface-2" />
          <div className="flex flex-1 flex-col gap-3">
            <div className="h-8 w-56 max-w-full animate-pulse rounded-lg bg-surface-2" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded bg-surface-2" />
          </div>
        </div>
        <div className="h-9 w-32 animate-pulse rounded-lg bg-surface-2" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-xl border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
