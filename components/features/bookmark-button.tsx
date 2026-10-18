"use client";
// Client island: bookmarks are per viewer and toggle optimistically, so the state cannot be part of the cached page.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { NETWORK_ERROR, readApiFailure, signInHref } from "@/components/features/client-api";
import { Button } from "@/components/ui/button";
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

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <Button
        variant="secondary"
        size="sm"
        aria-pressed={isBookmarked}
        disabled={busy}
        onClick={toggle}
      >
        {busy ? (
          <Spinner size="sm" label={ready ? "Updating bookmark" : "Loading bookmark"} />
        ) : (
          <BookmarkIcon className={cn("size-4", isBookmarked && "text-brand")} fill={isBookmarked ? "currentColor" : "none"} />
        )}
        {isBookmarked ? "Bookmarked" : "Bookmark"}
      </Button>
      <FormError message={error} />
    </div>
  );
}
