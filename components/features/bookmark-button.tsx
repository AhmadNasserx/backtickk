"use client";
// Client island: bookmarks are per viewer and toggle optimistically, so the state cannot be part of the cached page.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { NETWORK_ERROR, readApiFailure, signInHref } from "@/components/features/client-api";
import { FormError } from "@/components/ui/form-error";
import { BookmarkIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { BookmarkStatusDTO } from "@/types";

export type BookmarkButtonProps = {
  postId: string;
  className?: string;
};

export function BookmarkButton({ postId, className }: BookmarkButtonProps) {
  const router = useRouter();
  const { status } = useSession();
  const [bookmarked, setBookmarked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signedIn = status === "authenticated";
  const ready = status === "unauthenticated" || (signedIn && loaded);
  const isBookmarked = signedIn && bookmarked;

  useEffect(() => {
    if (status !== "authenticated") return;

    const controller = new AbortController();
    fetch(`/api/posts/${postId}/bookmark`, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          setBookmarked(false);
          return;
        }
        if (!response.ok) {
          throw new Error("Could not load bookmark");
        }
        const data = (await response.json()) as BookmarkStatusDTO;
        setBookmarked(data.bookmarked);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("Could not load your bookmark. Refresh to try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoaded(true);
      });

    return () => controller.abort();
  }, [status, postId]);

  async function toggle() {
    if (!ready || pending) return;
    if (!signedIn) {
      router.push(signInHref());
      return;
    }

    const previous = bookmarked;
    const next = !previous;
    setBookmarked(next);
    setPending(true);
    setError(null);

    let failure: string | null = null;
    try {
      const response = await fetch(`/api/posts/${postId}/bookmark`, { method: next ? "PUT" : "DELETE" });
      if (response.ok) {
        const data = (await response.json()) as BookmarkStatusDTO;
        setBookmarked(data.bookmarked);
        router.refresh();
      } else {
        failure = (await readApiFailure(response, "Could not update your bookmark.")).message;
      }
    } catch {
      failure = NETWORK_ERROR;
    }

    if (failure) {
      setBookmarked(previous);
      setError(failure);
    }
    setPending(false);
  }

  const busy = !ready || pending;

  // A toggle keeps one label; aria-pressed carries the state.
  return (
    <div className={cn("flex flex-col items-end gap-1.5", className)}>
      <button
        type="button"
        aria-label="Bookmark post"
        aria-pressed={isBookmarked}
        title={isBookmarked ? "Remove bookmark" : "Save to bookmarks"}
        disabled={busy}
        onClick={toggle}
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-xl border transition-colors disabled:cursor-wait sm:size-10",
          isBookmarked
            ? "border-accent/50 bg-accent-soft text-accent hover:border-accent"
            : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-fg",
        )}
      >
        {busy ? (
          <Spinner size="sm" label={ready ? "Updating bookmark" : "Loading bookmark"} />
        ) : (
          <BookmarkIcon className="size-4" fill={isBookmarked ? "currentColor" : "none"} />
        )}
      </button>
      <FormError message={error} className="max-w-xs px-2 py-1 text-xs" />
    </div>
  );
}
