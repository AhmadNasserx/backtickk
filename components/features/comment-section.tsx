"use client";
// Client island: the comment form, delete controls and their visibility depend on the viewer's session.

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { NETWORK_ERROR, readApiFailure, signInHref } from "@/components/features/client-api";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { FormError } from "@/components/ui/form-error";
import { MessageCircleIcon, TrashIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createCommentSchema } from "@/schemas/comment";
import { formatDate } from "@/lib/utils";
import type { AuthorRefDTO, CommentDTO } from "@/types";

// Matches createCommentSchema, shown as a counter while typing.
const MAX_COMMENT_LENGTH = 1000;

export type CommentSectionProps = {
  postId: string;
  postAuthorId: string;
  /** The first page of comments, rendered on the server. */
  initialComments: CommentDTO[];
};

/*
 * Comments added or deleted here are tracked locally so the list updates at once. The page is
 * refreshed afterwards, and rows already present in the server list are de-duplicated by id.
 */
function mergeComments(initial: CommentDTO[], added: CommentDTO[], removed: ReadonlySet<string>): CommentDTO[] {
  const seen = new Set<string>();
  const merged: CommentDTO[] = [];
  for (const comment of [...initial, ...added]) {
    if (removed.has(comment.id) || seen.has(comment.id)) continue;
    seen.add(comment.id);
    merged.push(comment);
  }
  return merged;
}

function AuthorName({ author }: { author: AuthorRefDTO }) {
  if (!author.id) {
    return <span className="font-medium text-muted">{author.name}</span>;
  }
  return (
    <Link href={`/profile/${encodeURIComponent(author.username)}`} className="font-medium text-fg hover:text-accent">
      {author.name}
    </Link>
  );
}

export function CommentSection({ postId, postAuthorId, initialComments }: CommentSectionProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const viewerId = status === "authenticated" ? session?.user.id : undefined;
  const viewerIsAdmin = status === "authenticated" && session?.user.role === "admin";

  const [draft, setDraft] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [added, setAdded] = useState<CommentDTO[]>([]);
  const [removed, setRemoved] = useState<ReadonlySet<string>>(() => new Set());
  // The comment whose delete is waiting for the inline confirmation.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const comments = mergeComments(initialComments, added, removed);

  function canDelete(comment: CommentDTO): boolean {
    if (!viewerId) return false;
    return viewerIsAdmin || viewerId === comment.author.id || viewerId === postAuthorId;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const parsed = createCommentSchema.safeParse({ content: draft });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Check your comment and try again.");
      return;
    }

    setFieldError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const failure = await readApiFailure(response, "Could not post your comment.");
        const contentError = failure.fieldErrors.content?.[0] ?? null;
        setFieldError(contentError);
        setFormError(contentError ? null : failure.message);
        return;
      }
      const created = (await response.json()) as CommentDTO;
      setAdded((current) => [...current, created]);
      setDraft("");
      router.refresh();
    } catch {
      setFormError(NETWORK_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(comment: CommentDTO) {
    setDeletingId(comment.id);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      if (!response.ok) {
        setDeleteError((await readApiFailure(response, "Could not delete the comment.")).message);
        return;
      }
      setRemoved((current) => new Set(current).add(comment.id));
      setAdded((current) => current.filter((item) => item.id !== comment.id));
      router.refresh();
    } catch {
      setDeleteError(NETWORK_ERROR);
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <section aria-labelledby="comments-heading" className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3 border-t border-line pt-10">
        <h2 id="comments-heading" className="font-display text-3xl tracking-tight text-fg">
          Comments
        </h2>
        <span className="font-mono text-sm text-subtle">{comments.length}</span>
      </div>

      {status === "authenticated" ? (
        <form onSubmit={onSubmit} noValidate aria-label="Add a comment" className="flex flex-col gap-3">
          <Field
            id="comment-content"
            label="Your comment"
            hint={`${draft.length} / ${MAX_COMMENT_LENGTH} characters`}
            error={fieldError}
          >
            <Textarea
              name="content"
              rows={3}
              value={draft}
              disabled={submitting}
              onChange={(event) => setDraft(event.target.value)}
            />
          </Field>
          <FormError message={formError} />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? <Spinner size="sm" label="Posting comment" /> : null}
              Post comment
            </Button>
          </div>
        </form>
      ) : status === "unauthenticated" ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">Sign in to join the discussion.</p>
          <Button variant="secondary" size="sm" onClick={() => router.push(signInHref())}>
            Sign in to comment
          </Button>
        </div>
      ) : (
        <div aria-hidden="true" className="skeleton h-32 rounded-xl" />
      )}

      <FormError message={deleteError} />

      {comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line px-6 py-10 text-center">
          <MessageCircleIcon className="size-6 text-subtle" />
          <p className="font-display text-2xl text-fg">Start the discussion</p>
          <p className="max-w-sm text-sm text-muted">No comments yet. Share a question, a fix or a better approach.</p>
        </div>
      ) : (
        <ol className="flex flex-col divide-y divide-line">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-4 py-6 first:pt-0 last:pb-0">
              <Avatar name={comment.author.name} src={comment.author.image} size="md" className="mt-0.5" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
                  <AuthorName author={comment.author} />
                  <time dateTime={comment.createdAt} className="font-mono text-xs text-subtle">
                    {formatDate(comment.createdAt)}
                  </time>
                  {canDelete(comment) ? (
                    <div className="ml-auto flex items-center">
                      {confirmingId === comment.id ? (
                        <div role="group" aria-label="Confirm comment deletion" className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted">Delete this comment?</span>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={deletingId === comment.id}
                            onClick={() => deleteComment(comment)}
                          >
                            {deletingId === comment.id ? <Spinner size="sm" label="Deleting comment" /> : null}
                            Delete
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === comment.id}
                            onClick={() => setConfirmingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Delete comment by ${comment.author.name}`}
                          title="Delete comment"
                          disabled={deletingId !== null}
                          onClick={() => setConfirmingId(comment.id)}
                          className="inline-flex size-10 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50 sm:size-8"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
                <p className="text-[0.95rem] leading-7 break-words whitespace-pre-wrap text-fg">{comment.content}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
