"use client";
// Client island: the two-step confirmation and the DELETE request run in the browser after user action.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NETWORK_ERROR, readApiFailure } from "@/components/features/client-api";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { TrashIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type DeletePostButtonProps = {
  postId: string;
  /** Where to go after a successful delete; without it the current page is refreshed. */
  redirectTo?: string;
  className?: string;
};

export function DeletePostButton({ postId, redirectTo, className }: DeletePostButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!response.ok) {
        setError((await readApiFailure(response, "Could not delete the post.")).message);
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn("text-danger hover:bg-danger/10 hover:text-danger", className)}
        onClick={() => setConfirming(true)}
      >
        <TrashIcon className="size-4" />
        Delete post
      </Button>
    );
  }

  return (
    <div role="group" aria-label="Confirm post deletion" className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-muted">Delete this post permanently?</span>
      <Button variant="danger" size="sm" disabled={pending} onClick={confirmDelete}>
        {pending ? <Spinner size="sm" label="Deleting post" /> : null}
        Yes, delete
      </Button>
      <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirming(false)}>
        Cancel
      </Button>
      <FormError message={error} className="w-full" />
    </div>
  );
}
