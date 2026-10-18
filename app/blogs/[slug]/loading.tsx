export default function Loading() {
  return (
    <div aria-busy="true" className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <span className="sr-only">Loading post</span>
      <div className="flex flex-col gap-5">
        <div className="h-5 w-48 animate-pulse rounded bg-surface-2" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-surface-2" />
        <div className="h-10 w-3/4 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-surface-2" />
        <div className="h-14 w-full animate-pulse rounded-xl bg-surface-2" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-11/12 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
      </div>
    </div>
  );
}
