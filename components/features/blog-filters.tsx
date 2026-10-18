"use client";
// Client island: filter changes apply straight away through the URL, which needs the browser router and live search params.

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, withParams } from "@/lib/utils";

export type BlogFiltersProps = {
  /** Communities offered in the select, already sorted for display. */
  communities: { slug: string; name: string }[];
  /** Matching post count, shown in the active-filter summary. */
  total?: number;
  className?: string;
};

export function BlogFilters({ communities, total, className }: BlogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const community = searchParams.get("community") ?? "";
  const topic = searchParams.get("topic");
  const author = searchParams.get("author");
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const search = searchParams.get("search") ?? undefined;

  // Clearing keeps the search term, which has its own input above.
  const activeSummary: string[] = [];
  if (community) {
    activeSummary.push(`Community: ${communities.find((item) => item.slug === community)?.name ?? community}`);
  }
  if (topic) activeSummary.push(`#${topic}`);
  if (author) activeSummary.push(`@${author}`);
  if (sort === "oldest") activeSummary.push("Oldest first");
  const hasFilters = activeSummary.length > 0;

  function update(changes: Record<string, string | null>) {
    const params = Object.fromEntries(searchParams.entries());
    router.push(`${pathname}${withParams(params, { ...changes, page: null })}`);
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
            {activeSummary.map((item) => (
              <span
                key={item}
                className="rounded-md border border-line bg-surface-2 px-2 py-0.5 font-mono text-xs text-fg"
              >
                {item}
              </span>
            ))}
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
