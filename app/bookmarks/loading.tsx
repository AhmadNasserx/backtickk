// Skeleton mirrors the bookmarks list so the page does not jump when the data arrives.
export default function BookmarksLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your bookmarks</span>
      <div className="flex flex-col gap-3">
        <div className="skeleton h-4 w-24 rounded-md" />
        <div className="skeleton h-12 w-48 max-w-full rounded-lg sm:h-14" />
        <div className="skeleton h-4 w-64 max-w-full rounded-md" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
