import Link from "next/link";
import { cn, withParams } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";

export type PaginationProps = {
  /** Current 1-based page. */
  page: number;
  totalPages: number;
  /** Path the links point at, e.g. "/blogs". */
  basePath: string;
  /** Current query params; other filters are kept, `page` is replaced. Page 1 drops the param. */
  searchParams?: Record<string, string | undefined>;
  className?: string;
};

type PageItem = number | "ellipsis";

export function getPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: PageItem[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) items.push("ellipsis");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push("ellipsis");
  items.push(totalPages);

  return items;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams = {},
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) =>
    `${basePath}${withParams(searchParams, { page: target === 1 ? null : target })}`;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-between gap-3", className)}
    >
      {hasPrev ? (
        <Link rel="prev" href={hrefFor(page - 1)} className={buttonClasses("secondary", "sm")}>
          Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={buttonClasses("secondary", "sm", "opacity-50")}>
          Previous
        </span>
      )}

      <p className="text-sm text-muted sm:hidden">
        Page {page} of {totalPages}
      </p>

      <ol className="hidden items-center gap-1 sm:flex">
        {getPageItems(page, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${index}`} aria-hidden="true" className="px-2 text-subtle">
              &hellip;
            </li>
          ) : (
            <li key={item}>
              {item === page ? (
                <span
                  aria-current="page"
                  className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-brand px-2 text-sm font-medium text-white"
                >
                  {item}
                </span>
              ) : (
                <Link
                  href={hrefFor(item)}
                  aria-label={`Page ${item}`}
                  className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm text-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {item}
                </Link>
              )}
            </li>
          ),
        )}
      </ol>

      {hasNext ? (
        <Link rel="next" href={hrefFor(page + 1)} className={buttonClasses("secondary", "sm")}>
          Next
        </Link>
      ) : (
        <span aria-disabled="true" className={buttonClasses("secondary", "sm", "opacity-50")}>
          Next
        </span>
      )}
    </nav>
  );
}
