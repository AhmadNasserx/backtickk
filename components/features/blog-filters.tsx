"use client";
// Client island: filter changes apply straight away through the URL, which needs the browser router and live search params.

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { buttonClasses } from "@/components/ui/button";
import { cn, withParams } from "@/lib/utils";

export type BlogFiltersProps = {
  /** Communities offered in the select, already sorted for display. */
  communities: { slug: string; name: string }[];
  className?: string;
};

export function BlogFilters({ communities, className }: BlogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const community = searchParams.get("community") ?? "";
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const hasFilters = Boolean(
    community || searchParams.get("topic") || searchParams.get("author") || sort === "oldest",
  );
  const search = searchParams.get("search") ?? undefined;

  function update(changes: Record<string, string | null>) {
    const params = Object.fromEntries(searchParams.entries());
    router.push(`${pathname}${withParams(params, { ...changes, page: null })}`);
  }

  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      <div className="w-full sm:w-56">
        <Field id="blog-filter-community" label="Community">
          <Select value={community} onChange={(event) => update({ community: event.target.value || null })}>
            <option value="">All communities</option>
            {communities.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="w-full sm:w-44">
        <Field id="blog-filter-sort" label="Sort by">
          <Select value={sort} onChange={(event) => update({ sort: event.target.value === "newest" ? null : event.target.value })}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </Select>
        </Field>
      </div>

      {hasFilters ? (
        <Link
          href={`${pathname}${withParams({ search }, {})}`}
          className={buttonClasses("ghost", "md")}
        >
          Clear filters
        </Link>
      ) : null}
    </div>
  );
}
