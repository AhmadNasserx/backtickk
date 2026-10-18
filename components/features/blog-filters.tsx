"use client";
// Client island: filter changes apply straight away through the URL, which needs the browser router and live search params.

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { CONTROL_BASE, Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { XIcon } from "@/components/ui/icons";
import { cn, withParams } from "@/lib/utils";

const AUTHOR_DEBOUNCE_MS = 300;
// Same rule as the server's usernameFilter (schemas/query.ts): letters, digits, "_" and "-", at most 30 characters.
const USERNAME_PATTERN = /^[a-z0-9_-]{1,30}$/;

export type BlogFiltersProps = {
  /** Communities offered in the select, already sorted for display. */
  communities: { slug: string; name: string }[];
  /** Matching post count, shown in the active-filter summary. */
  total?: number;
  className?: string;
};

/** Typed author in canonical form: trimmed, lowercase, without a leading @. */
function normalizeAuthor(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, "");
}

/** Builds the list URL with `changes` applied, keeping every other param and dropping `page`. */
function filterHref(pathname: string, searchParams: URLSearchParams, changes: Record<string, string | null>): string {
  const params = Object.fromEntries(searchParams.entries());
  return `${pathname}${withParams(params, { ...changes, page: null })}`;
}

export function BlogFilters({ communities, total, className }: BlogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const community = searchParams.get("community") ?? "";
  const topic = searchParams.get("topic");
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const search = searchParams.get("search") ?? undefined;

  // Same validation as the server, so a chip is only shown for an author the page actually filters by.
  const rawAuthor = (searchParams.get("author") ?? "").trim().toLowerCase();
  const activeAuthor = USERNAME_PATTERN.test(rawAuthor) ? rawAuthor : "";

  const [authorDraft, setAuthorDraft] = useState(activeAuthor);
  const authorRef = useRef<HTMLInputElement>(null);
  const typedAuthor = normalizeAuthor(authorDraft);
  const typedValid = typedAuthor === "" || USERNAME_PATTERN.test(typedAuthor);
  // The last author this field pushed. Its own navigation must not overwrite what the user is still typing.
  const lastPushed = useRef<string | null>(null);

  useEffect(() => {
    if (activeAuthor === lastPushed.current) return;
    // The URL changed from elsewhere (chip removed, "Clear filters"), so show the new value.
    setAuthorDraft(activeAuthor);
  }, [activeAuthor]);

  useEffect(() => {
    if (!typedValid || typedAuthor === activeAuthor) return;
    const timer = setTimeout(() => {
      lastPushed.current = typedAuthor;
      router.push(filterHref(pathname, searchParams, { author: typedAuthor || null }));
    }, AUTHOR_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [typedAuthor, typedValid, activeAuthor, pathname, searchParams, router]);

  function removeAuthor() {
    lastPushed.current = "";
    setAuthorDraft("");
    router.push(filterHref(pathname, searchParams, { author: null }));
    authorRef.current?.focus();
  }

  // Clearing keeps the search term, which has its own input above.
  const chips: { key: string; label: string; removable?: boolean }[] = [];
  if (community) {
    chips.push({
      key: "community",
      label: `Community: ${communities.find((item) => item.slug === community)?.name ?? community}`,
    });
  }
  if (topic) chips.push({ key: "topic", label: `#${topic}` });
  if (activeAuthor) chips.push({ key: "author", label: `@${activeAuthor}`, removable: true });
  if (sort === "oldest") chips.push({ key: "sort", label: "Oldest first" });
  const hasFilters = chips.length > 0;

  function update(changes: Record<string, string | null>) {
    router.push(filterHref(pathname, searchParams, changes));
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap gap-3">
        <Field id="blog-filter-community" label="Community" className="min-w-[11rem] flex-1 sm:w-56 sm:flex-none">
          <Select value={community} onChange={(event) => update({ community: event.target.value || null })}>
            <option value="">All communities</option>
            {communities.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id="blog-filter-author"
          label="Author"
          hint="Username, with or without @"
          error={authorDraft.trim() && !typedValid ? "Use letters, numbers, _ or -, up to 30 characters." : null}
          className="min-w-[11rem] flex-1 sm:w-56 sm:flex-none"
        >
          <input
            ref={authorRef}
            type="text"
            name="author"
            value={authorDraft}
            onChange={(event) => setAuthorDraft(event.target.value)}
            placeholder="@username"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className={cn(CONTROL_BASE, "h-11 px-3 text-base sm:h-10 sm:text-sm")}
          />
        </Field>

        <Field id="blog-filter-sort" label="Sort by" className="min-w-[9rem] flex-1 sm:w-44 sm:flex-none">
          <Select
            value={sort}
            onChange={(event) => update({ sort: event.target.value === "newest" ? null : event.target.value })}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </Select>
        </Field>
      </div>

      {hasFilters ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-muted sm:px-4">
          <p className="flex min-w-0 flex-wrap items-center gap-2">
            {total !== undefined ? (
              <span className="font-mono text-fg">
                {total} {total === 1 ? "match" : "matches"}
              </span>
            ) : (
              <span>Filtered</span>
            )}
            <span aria-hidden="true" className="text-subtle">
              ·
            </span>
            <span className="sr-only">Active filters:</span>
            {chips.map((chip) =>
              chip.removable ? (
                <button
                  key={chip.key}
                  type="button"
                  onClick={removeAuthor}
                  aria-label={`Remove author filter ${chip.label}`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2 font-mono text-xs text-fg transition-colors hover:border-line-strong hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-0 sm:py-0.5"
                >
                  {chip.label}
                  <XIcon aria-hidden="true" className="size-3.5 text-subtle" />
                </button>
              ) : (
                <span
                  key={chip.key}
                  className="rounded-md border border-line bg-surface-2 px-2 py-0.5 font-mono text-xs text-fg"
                >
                  {chip.label}
                </span>
              ),
            )}
          </p>
          <Link
            href={`${pathname}${withParams({ search }, {})}`}
            className={buttonClasses("ghost", "sm", "ml-auto")}
          >
            Clear filters
          </Link>
        </div>
      ) : null}
    </div>
  );
}
