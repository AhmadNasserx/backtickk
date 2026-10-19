"use client";
// Client island: the live results need debounced fetching with AbortController, keyboard navigation and focus tracking.

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CommunityIcon } from "@/components/features/community-card";
import { ArrowRightIcon, SearchIcon } from "@/components/ui/icons";
import { blogSearchHref } from "@/data/navigation";
import { cn } from "@/lib/utils";
import type { SearchResultDTO } from "@/types";

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;
const RESULT_LIMIT = 5;

type SearchState = { term: string; status: "ready"; data: SearchResultDTO } | { term: string; status: "error" };

export type SearchComboboxProps = {
  id?: string;
  label: string;
  placeholder: string;
  inputRef: RefObject<HTMLInputElement | null>;
  /** Classes for the form, which is also the positioning context for the results panel. */
  formClassName: string;
  /** Classes for the text input. Height and padding come from the caller because cn() cannot merge them with the base. */
  inputClassName: string;
  keyShortcuts?: string;
  /** Rendered inside the form after the field, e.g. the ⌘K hint or a close button. */
  trailing?: ReactNode;
  /** Called after a result or a submit navigates, so the caller can close its overlay. */
  onNavigate?: () => void;
  /** Called on Escape when the results are already closed. */
  onEscape?: () => void;
};

/**
 * Search field with a live results list of communities and posts, shared by the desktop bar and the mobile overlay.
 * The list is a combobox: arrow keys move through it, Enter opens the highlighted item or submits the query, Escape closes it.
 */
export function SearchCombobox({
  id,
  label,
  placeholder,
  inputRef,
  formClassName,
  inputClassName,
  keyShortcuts,
  trailing,
  onNavigate,
  onEscape,
}: SearchComboboxProps) {
  const router = useRouter();
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listboxId = `${baseId}-listbox`;
  const formRef = useRef<HTMLFormElement>(null);

  const [value, setValue] = useState("");
  const [state, setState] = useState<SearchState | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const term = value.trim();
  const searching = term.length >= MIN_CHARS;
  // A response only counts for the term it was requested for, so an older answer never shows under a newer query.
  const settled = searching && state && state.term === term ? state : null;
  const communities = settled?.status === "ready" ? settled.data.communities : [];
  const posts = settled?.status === "ready" ? settled.data.posts.items : [];
  const loading = searching && !settled;
  const failed = settled?.status === "error";
  const open = searching && !dismissed;

  // Flat list of destinations in display order. The last one is always "See all results".
  const hrefs: string[] = settled
    ? [
        ...communities.map((community) => `/communities/${community.slug}`),
        ...posts.map((post) => `/blogs/${post.slug}`),
        blogSearchHref(term),
      ]
    : [];
  const optionCount = hrefs.length;
  const optionId = (index: number) => `${baseId}-option-${index}`;
  const activeOptionId = open && activeIndex >= 0 && activeIndex < optionCount ? optionId(activeIndex) : undefined;

  useEffect(() => {
    if (term.length < MIN_CHARS) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?${new URLSearchParams({ q: term, limit: String(RESULT_LIMIT) })}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Search failed with ${response.status}`);
        const data = (await response.json()) as SearchResultDTO;
        if (controller.signal.aborted) return;
        setState({ term, status: "ready", data });
      } catch {
        if (controller.signal.aborted) return;
        setState({ term, status: "error" });
      }
    }, DEBOUNCE_MS);
    // A new term cancels the pending request and timer, so only the latest query can write results.
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  useEffect(() => {
    if (!open) return;
    // Clicks outside the form close the list. Focus leaving the form is handled by onBlur.
    function onPointerDown(event: PointerEvent) {
      if (!formRef.current?.contains(event.target as Node)) setDismissed(true);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document.getElementById(`${baseId}-option-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, baseId]);

  function finish(href: string) {
    setDismissed(true);
    router.push(href);
    onNavigate?.();
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
    setDismissed(false);
    setActiveIndex(-1);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (optionCount === 0) return;
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      if (!open) {
        setDismissed(false);
        setActiveIndex(step > 0 ? 0 : optionCount - 1);
        return;
      }
      setActiveIndex((current) =>
        current < 0 ? (step > 0 ? 0 : optionCount - 1) : (current + step + optionCount) % optionCount,
      );
      return;
    }

    if (event.key === "Enter") {
      // Without a highlighted item the form's submit handler runs and goes to the full results.
      if (!open || activeIndex < 0 || activeIndex >= optionCount) return;
      event.preventDefault();
      finish(hrefs[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setDismissed(true);
        setActiveIndex(-1);
      } else {
        onEscape?.();
      }
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    finish(blogSearchHref(value));
  }

  function onBlur(event: FocusEvent<HTMLFormElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDismissed(true);
  }

  function closeOnClick() {
    setDismissed(true);
    onNavigate?.();
  }

  let message: string | null = null;
  if (loading) message = "Searching…";
  else if (failed) message = "Search is unavailable right now. Try again in a moment.";
  else if (settled && communities.length + posts.length === 0) message = `No matches for “${term}”`;

  const optionClass = "flex min-h-11 min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-sm text-fg transition-colors";
  const activeClass = "bg-surface-3";

  return (
    <form ref={formRef} id={id} role="search" onSubmit={onSubmit} onBlur={onBlur} className={formClassName}>
      <div className="relative min-w-0 flex-1">
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle transition-colors group-focus-within:text-accent" />
        <input
          ref={inputRef}
          id={inputId}
          name="search"
          type="search"
          role="combobox"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={activeOptionId}
          aria-busy={loading || undefined}
          aria-keyshortcuts={keyShortcuts}
          onChange={onChange}
          onFocus={() => setDismissed(false)}
          onKeyDown={onKeyDown}
          className={inputClassName}
        />
      </div>

      {open ? (
        <div
          // Keeps focus in the field while a result is clicked, so the list does not close before the link is followed.
          onMouseDown={(event) => event.preventDefault()}
          className="absolute inset-x-4 top-full z-50 mt-2 max-h-[min(70dvh,28rem)] overflow-y-auto overscroll-contain rounded-xl border border-line-strong bg-surface-2 p-2 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] lg:inset-x-0"
        >
          {message ? (
            <p role="status" className="px-3 py-2 text-sm text-muted">
              {message}
            </p>
          ) : null}

          <div id={listboxId} role="listbox" aria-label="Search results" className="flex flex-col">
            {communities.length > 0 ? (
              <div role="group" aria-labelledby={`${baseId}-communities`} className="flex flex-col">
                <p id={`${baseId}-communities`} role="presentation" className="eyebrow px-3 pt-2 pb-1">
                  Communities
                </p>
                {communities.map((community, index) => (
                  <Link
                    key={community.id}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === activeIndex}
                    href={hrefs[index]}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={closeOnClick}
                    className={cn(optionClass, index === activeIndex && activeClass)}
                  >
                    <CommunityIcon community={community} slug={community.slug} size="sm" />
                    <span className="truncate font-medium">{community.name}</span>
                  </Link>
                ))}
              </div>
            ) : null}

            {posts.length > 0 ? (
              <div role="group" aria-labelledby={`${baseId}-posts`} className="flex flex-col">
                <p id={`${baseId}-posts`} role="presentation" className="eyebrow px-3 pt-2 pb-1">
                  Posts
                </p>
                {posts.map((post, offset) => {
                  const index = communities.length + offset;
                  return (
                    <Link
                      key={post.id}
                      id={optionId(index)}
                      role="option"
                      aria-selected={index === activeIndex}
                      href={hrefs[index]}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={closeOnClick}
                      className={cn(optionClass, index === activeIndex && activeClass)}
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{post.title}</span>
                        <span className="truncate text-xs text-subtle">{post.author.name}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : null}

            {settled ? (
              <Link
                id={optionId(optionCount - 1)}
                role="option"
                aria-selected={optionCount - 1 === activeIndex}
                href={hrefs[optionCount - 1]}
                onMouseEnter={() => setActiveIndex(optionCount - 1)}
                onClick={closeOnClick}
                className={cn(optionClass, "mt-1 border-t border-line pt-3", optionCount - 1 === activeIndex && activeClass)}
              >
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate text-muted">
                    See all results for “{term}”
                  </span>
                  <ArrowRightIcon aria-hidden="true" className="size-4 shrink-0 text-accent" />
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {trailing}
    </form>
  );
}
