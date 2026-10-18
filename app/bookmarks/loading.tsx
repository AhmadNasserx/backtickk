// Skeleton mirrors the bookmarks list so the page does not jump when the data arrives.
export default function BookmarksLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your bookmarks</span>
      <div className="flex flex-col gap-2">
        <div className="h-8 w-40 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-64 max-w-full animate-pulse rounded bg-surface-2" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
