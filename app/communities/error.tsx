"use client";
// Error boundaries must be Client Components, as Next requires for error.tsx.

import { useEffect } from "react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function CommunitiesError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <p className="eyebrow">Error</p>
      <h1 className="font-display text-4xl leading-tight tracking-tight text-fg">Communities could not load</h1>
      <p className="text-muted">Something went wrong while loading communities. Try again in a moment.</p>
      {error.digest ? <p className="font-mono text-xs text-subtle">Reference: {error.digest}</p> : null}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => unstable_retry()} className={buttonClasses("primary", "md")}>
          Try again
        </button>
        <Link href="/" className={buttonClasses("secondary", "md")}>
          Go home
        </Link>
      </div>
    </div>
  );
}
