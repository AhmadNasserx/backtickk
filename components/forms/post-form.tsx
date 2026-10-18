"use client";
// Client boundary: live validation, the Write/Preview tabs, Markdown preview and fetch submissions need browser state.

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type Ref } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { FormError } from "@/components/ui/form-error";
import { cn } from "@/lib/utils";
import { createPostSchema, type CreatePostInput } from "@/schemas/post";
import { TagInput } from "@/components/forms/tag-input";
import { focusFirstInvalid, readFormFailure, zodFieldErrors, type FieldErrors } from "@/components/forms/form-errors";
import { NETWORK_ERROR } from "@/components/features/client-api";
import type { PostDetailDTO, PostStatus } from "@/types";

export interface PostFormCommunity {
  id: string;
  name: string;
}

export interface PostFormInitial {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  communityId: string;
  tags: string[];
  coverImage: string | null;
  status: PostStatus;
}

export type PostFormProps = {
  communities: PostFormCommunity[];
} & (
  | { mode: "create"; initial?: undefined }
  | { mode: "edit"; initial: PostFormInitial }
);

interface PostValues {
  title: string;
  excerpt: string;
  content: string;
  communityId: string;
  tags: string[];
  coverImage: string;
  status: PostStatus;
}

type EditorTab = "write" | "preview";

const EXCERPT_MAX = 240;
const MAX_TAGS = 5;

const TAB_IDS: Record<EditorTab, { tab: string; panel: string }> = {
  write: { tab: "post-content-tab-write", panel: "post-content-panel-write" },
  preview: { tab: "post-content-tab-preview", panel: "post-content-panel-preview" },
};

function emptyValues(): PostValues {
  return { title: "", excerpt: "", content: "", communityId: "", tags: [], coverImage: "", status: "published" };
}

function valuesFromInitial(initial: PostFormInitial): PostValues {
  return {
    title: initial.title,
    excerpt: initial.excerpt,
    content: initial.content,
    communityId: initial.communityId,
    tags: initial.tags,
    coverImage: initial.coverImage ?? "",
    status: initial.status,
  };
}

function toLowerTag(raw: string): string {
  return raw.toLowerCase();
}

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

/**
 * Only the fields that differ from the loaded post. Clearing the cover image sends '' so the
 * server unsets it.
 */
function changedFields(initial: PostFormInitial, next: CreatePostInput): Partial<CreatePostInput> {
  const patch: Partial<CreatePostInput> = {};
  if (next.title !== initial.title) patch.title = next.title;
  if (next.excerpt !== initial.excerpt) patch.excerpt = next.excerpt;
  if (next.content !== initial.content) patch.content = next.content;
  if (next.communityId !== initial.communityId) patch.communityId = next.communityId;
  if (!sameList(next.tags, initial.tags)) patch.tags = next.tags;
  const nextCover = next.coverImage ?? "";
  if (nextCover !== (initial.coverImage ?? "")) patch.coverImage = nextCover;
  if (next.status !== initial.status) patch.status = next.status;
  return patch;
}

export function PostForm(props: PostFormProps) {
  const { communities, mode } = props;
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const writeTabRef = useRef<HTMLButtonElement>(null);
  const previewTabRef = useRef<HTMLButtonElement>(null);

  const [values, setValues] = useState<PostValues>(() =>
    props.mode === "edit" ? valuesFromInitial(props.initial) : emptyValues(),
  );
  const [tab, setTab] = useState<EditorTab>("write");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [invalidAttempt, setInvalidAttempt] = useState(0);

  // Runs after the render that shows the errors, so the target has aria-invalid when we look for it.
  useEffect(() => {
    if (invalidAttempt > 0) focusFirstInvalid(formRef.current);
  }, [invalidAttempt]);

  function setField<K extends keyof PostValues>(key: K, value: PostValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function showErrors(next: FieldErrors) {
    setErrors(next);
    if (next.content) setTab("write");
    if (Object.keys(next).length > 0) setInvalidAttempt((n) => n + 1);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    let next: EditorTab | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      next = tab === "write" ? "preview" : "write";
    } else if (event.key === "Home") {
      next = "write";
    } else if (event.key === "End") {
      next = "preview";
    }
    if (!next) return;

    event.preventDefault();
    setTab(next);
    (next === "write" ? writeTabRef : previewTabRef).current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    const parsed = createPostSchema.safeParse(values);
    if (!parsed.success) {
      const issues = zodFieldErrors(parsed.error);
      // The schema's generic "Invalid community id" reads badly for an unselected dropdown.
      if (!values.communityId) issues.communityId = "Choose a community to publish in";
      showErrors(issues);
      return;
    }

    let url = "/api/posts";
    let method = "POST";
    let body: Partial<CreatePostInput> = parsed.data;

    if (props.mode === "edit") {
      body = changedFields(props.initial, parsed.data);
      if (Object.keys(body).length === 0) {
        router.push(`/blogs/${props.initial.slug}`);
        return;
      }
      url = `/api/posts/${props.initial.id}`;
      method = "PATCH";
    }

    setErrors({});
    setSubmitting(true);
    let succeeded = false;
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const failure = await readFormFailure(response);
        setFormError(failure.message);
        showErrors(failure.fieldErrors);
        return;
      }
      const post: Pick<PostDetailDTO, "slug"> = await response.json();
      succeeded = true;
      router.push(`/blogs/${post.slug}`);
      router.refresh();
    } catch {
      setFormError(NETWORK_ERROR);
    } finally {
      if (!succeeded) setSubmitting(false);
    }
  }

  const submitLabel =
    mode === "edit" ? "Save changes" : values.status === "draft" ? "Save draft" : "Publish post";
  const cancelHref = props.mode === "edit" ? `/blogs/${props.initial.slug}` : "/dashboard";

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <FormError message={formError} />

      <Field id="post-title" label="Title" error={errors.title} hint="5-120 characters.">
        <Input
          value={values.title}
          onChange={(event) => setField("title", event.target.value)}
          autoComplete="off"
        />
      </Field>

      <Field
        id="post-excerpt"
        label="Excerpt"
        hint={`${values.excerpt.length}/${EXCERPT_MAX} characters. Shown in listings.`}
        error={errors.excerpt}
      >
        <Textarea
          value={values.excerpt}
          onChange={(event) => setField("excerpt", event.target.value)}
          rows={2}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="post-community" label="Community" error={errors.communityId}>
          <Select value={values.communityId} onChange={(event) => setField("communityId", event.target.value)}>
            <option value="">Choose a community</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="post-status" label="Status" error={errors.status}>
          <Select
            value={values.status}
            onChange={(event) => setField("status", event.target.value === "draft" ? "draft" : "published")}
          >
            <option value="published">Published: visible to everyone</option>
            <option value="draft">Draft: only you can see it</option>
          </Select>
        </Field>
      </div>

      <Field
        id="post-tags"
        label="Tags"
        hint={`Up to ${MAX_TAGS}, lowercase. Letters, digits, + # . and -. Press Enter or a comma to add.`}
        error={errors.tags}
      >
        <TagInput
          id="post-tags"
          value={values.tags}
          onChange={(tags) => setField("tags", tags)}
          max={MAX_TAGS}
          normalize={toLowerTag}
          placeholder="e.g. react, nextjs"
        />
      </Field>

      <Field
        id="post-cover"
        label="Cover image URL (optional)"
        hint="Starts with https:// or http://"
        error={errors.coverImage}
      >
        <Input
          type="url"
          inputMode="url"
          value={values.coverImage}
          onChange={(event) => setField("coverImage", event.target.value)}
          placeholder="https://"
          autoComplete="off"
        />
      </Field>

      <section aria-labelledby="post-content-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="post-content-heading" className="text-sm font-medium text-fg">
            Content
          </h2>
          <div
            role="tablist"
            aria-label="Editor view"
            className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5"
          >
            <EditorTabButton
              ref={writeTabRef}
              tabKey="write"
              label="Write"
              selected={tab === "write"}
              onSelect={() => setTab("write")}
              onKeyDown={onTabKeyDown}
            />
            <EditorTabButton
              ref={previewTabRef}
              tabKey="preview"
              label="Preview"
              selected={tab === "preview"}
              onSelect={() => setTab("preview")}
              onKeyDown={onTabKeyDown}
            />
          </div>
        </div>

        <div
          role="tabpanel"
          id={TAB_IDS.write.panel}
          aria-labelledby={TAB_IDS.write.tab}
          hidden={tab !== "write"}
          tabIndex={0}
        >
          <Field
            id="post-content"
            label="Markdown"
            hint="Raw HTML is not rendered."
            error={errors.content}
          >
            <Textarea
              value={values.content}
              onChange={(event) => setField("content", event.target.value)}
              rows={16}
              className="font-mono text-sm"
              spellCheck
            />
          </Field>
        </div>

        <div
          role="tabpanel"
          id={TAB_IDS.preview.panel}
          aria-labelledby={TAB_IDS.preview.tab}
          hidden={tab !== "preview"}
          tabIndex={0}
          className="min-h-64 rounded-lg border border-line bg-surface px-5 py-4"
        >
          {values.content.trim() ? (
            <div className="prose-dev">
              <ReactMarkdown>{values.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-subtle">Nothing to preview yet. Write some Markdown first.</p>
          )}
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-end">
        <Link href={cancelHref} className={buttonClasses("secondary", "md")}>
          Cancel
        </Link>
        <Button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? <Spinner size="sm" label="Saving" /> : null}
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

interface EditorTabButtonProps {
  tabKey: EditorTab;
  label: string;
  selected: boolean;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  ref: Ref<HTMLButtonElement>;
}

/** Roving tabindex: only the selected tab sits in the Tab order; arrow keys move between them. */
function EditorTabButton({ tabKey, label, selected, onSelect, onKeyDown, ref }: EditorTabButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={TAB_IDS[tabKey].tab}
      aria-controls={TAB_IDS[tabKey].panel}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "h-8 rounded-md px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
        selected ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
      )}
    >
      {label}
    </button>
  );
}
