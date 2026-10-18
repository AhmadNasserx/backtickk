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
const CONTENT_MAX = 20000;
const MAX_TAGS = 5;

const STATUS_OPTIONS: { value: PostStatus; label: string; hint: string }[] = [
  { value: "draft", label: "Draft", hint: "Only you" },
  { value: "published", label: "Published", hint: "Everyone" },
];

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
  // The cover field is optional, so it starts collapsed unless the post already has a cover or it has an error.
  const [coverOpen, setCoverOpen] = useState(() => props.mode === "edit" && Boolean(props.initial.coverImage));
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
    // The cover field sits in a collapsed disclosure, so open it or its error cannot be focused.
    if (next.coverImage) setCoverOpen(true);
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
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      <FormError message={formError} />

      {/* Title reads as the page's headline: a large display-font field with no visible box. The label stays for screen readers. */}
      <Field
        id="post-title"
        label="Title"
        error={errors.title}
        hint="5-120 characters."
        className="[&>label]:sr-only"
      >
        <Input
          value={values.title}
          onChange={(event) => setField("title", event.target.value)}
          placeholder="Give your post a title"
          autoComplete="off"
          className="h-auto border-transparent bg-transparent px-0 py-1 font-display text-4xl leading-tight text-fg placeholder:text-subtle hover:border-transparent sm:text-5xl"
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id="post-community" label="Community" error={errors.communityId} className="min-w-0">
          <Select value={values.communityId} onChange={(event) => setField("communityId", event.target.value)}>
            <option value="">Choose a community</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </Select>
        </Field>

        <fieldset className="flex min-w-0 flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium text-fg">Status</legend>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface-2 p-1">
            {STATUS_OPTIONS.map((option) => (
              <label key={option.value} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="post-status"
                  value={option.value}
                  checked={values.status === option.value}
                  onChange={() => setField("status", option.value)}
                  aria-describedby={errors.status ? "post-status-error" : undefined}
                  className="peer sr-only"
                />
                <span className="flex h-10 flex-col items-center justify-center rounded-lg text-sm font-medium text-muted transition-colors hover:text-fg peer-checked:bg-surface-3 peer-checked:text-fg peer-checked:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                  {option.label}
                  <span className="font-mono text-[10px] tracking-wide text-muted uppercase">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.status ? (
            <p id="post-status-error" className="text-sm text-danger">
              {errors.status}
            </p>
          ) : null}
        </fieldset>
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
          chipPrefix="#"
          placeholder="e.g. react, nextjs"
        />
      </Field>

      <details
        open={coverOpen}
        onToggle={(event) => setCoverOpen(event.currentTarget.open)}
        className="group rounded-xl border border-line bg-surface"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium text-fg transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <span>
            Cover image <span className="font-normal text-subtle">(optional)</span>
          </span>
          <span aria-hidden="true" className="font-mono text-lg leading-none text-subtle transition-transform group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="px-4 pb-4">
          <Field
            id="post-cover"
            label="Cover image URL"
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
        </div>
      </details>

      <section aria-labelledby="post-content-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="post-content-heading" className="eyebrow">
            Content
          </h2>
          <div
            role="tablist"
            aria-label="Editor view"
            className="inline-flex rounded-xl border border-line bg-surface-2 p-1"
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
          className="focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-xl"
        >
          <Field
            id="post-content"
            label="Markdown"
            hint={`${values.content.length}/${CONTENT_MAX} characters. Raw HTML is not rendered.`}
            error={errors.content}
            className="[&>label]:sr-only"
          >
            <Textarea
              value={values.content}
              onChange={(event) => setField("content", event.target.value)}
              rows={16}
              className="min-h-[50vh] font-mono text-sm leading-relaxed"
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
          className="min-h-[50vh] rounded-xl border border-line bg-surface px-5 py-4 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none sm:px-8 sm:py-6"
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

      {/*
        Mobile: a sticky bar that sits above the fixed bottom tab bar (4.25rem tall plus the safe area).
        Desktop: the same buttons sit inline at the end of the form.
      */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+4.25rem)] z-10 -mx-4 flex gap-3 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-bg/75 lg:static lg:mx-0 lg:justify-end lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <Link href={cancelHref} className={buttonClasses("secondary", "md", "flex-1 lg:flex-none")}>
          Cancel
        </Link>
        <Button type="submit" disabled={submitting} aria-busy={submitting} className="flex-1 lg:flex-none">
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
        "h-8 rounded-lg px-3.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
        selected ? "bg-surface-3 text-fg shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]" : "text-muted hover:text-fg",
      )}
    >
      {label}
    </button>
  );
}
