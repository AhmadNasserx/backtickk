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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createCommentSchema } from "@/schemas/comment";
import { formatDate } from "@/lib/utils";
import type { AuthorRefDTO, CommentDTO } from "@/types";

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
    <Link href={`/profile/${encodeURIComponent(author.username)}`} className="font-medium text-fg hover:underline">
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
    }
  }

  return (
    <section aria-labelledby="comments-heading" className="flex flex-col gap-6">
      <h2 id="comments-heading" className="text-xl font-semibold tracking-tight text-fg">
        Comments
      </h2>

      {status === "authenticated" ? (
        <form onSubmit={onSubmit} noValidate aria-label="Add a comment" className="flex flex-col gap-3">
          <Field id="comment-content" label="Your comment" hint="Up to 1000 characters." error={fieldError}>
            <Textarea
              name="content"
              rows={4}
              value={draft}
              disabled={submitting}
              onChange={(event) => setDraft(event.target.value)}
            />
          </Field>
          <FormError message={formError} />
          <div>
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
        <div aria-hidden="true" className="h-32 animate-pulse rounded-xl bg-surface-2" />
      )}

      <FormError message={deleteError} />

      {comments.length === 0 ? (
        <p className="text-sm text-muted">No comments yet. Be the first to share your thoughts.</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3 rounded-xl border border-line bg-surface p-4">
              <Avatar name={comment.author.name} src={comment.author.image} size="md" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <AuthorName author={comment.author} />
                  <time dateTime={comment.createdAt} className="text-subtle">
                    {formatDate(comment.createdAt)}
                  </time>
                  {canDelete(comment) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-7 px-2 text-danger hover:text-danger"
                      disabled={deletingId === comment.id}
                      aria-label={`Delete comment by ${comment.author.name}`}
                      onClick={() => deleteComment(comment)}
                    >
                      {deletingId === comment.id ? <Spinner size="sm" label="Deleting comment" /> : null}
                      Delete
                    </Button>
                  ) : null}
                </div>
                <p className="text-sm leading-6 break-words whitespace-pre-wrap text-fg">{comment.content}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
