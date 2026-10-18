"use client";
// Error boundaries must be Client Components, as Next requires for error.tsx.

import { useEffect } from "react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function ErrorPage({
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
    <div className="relative isolate mx-auto flex min-h-[60dvh] w-full max-w-2xl flex-col justify-center gap-6 py-12">
      <div
        aria-hidden="true"
        className="bg-glow pointer-events-none absolute -top-24 -right-24 -z-10 size-96"
      />

      <p className="eyebrow">Unexpected error</p>
      <h1 className="font-display text-4xl leading-tight tracking-tight text-balance text-fg sm:text-5xl">
        Something broke while loading this page.
      </h1>
      <p className="max-w-prose text-base leading-relaxed text-muted">
        The error has been logged. Try again in a moment, or head back to the home page.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-subtle">Reference: {error.digest}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className={buttonClasses("primary", "md")}
        >
          Try again
        </button>
        <Link href="/" className={buttonClasses("secondary", "md")}>
          Go home
        </Link>
      </div>
    </div>
  );
}
