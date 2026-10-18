import Link from "next/link";
import { cn, withParams } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

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

// Pills with 44px targets on mobile. Numerals are mono so the column of pages does not jitter.
const NAV_BUTTON =
  "inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-4 text-sm font-medium text-fg shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] transition-[color,background-color,border-color,transform] duration-200 ease-out hover:border-line-strong hover:bg-surface-3 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-sm:h-11 max-sm:px-4";

const NAV_DISABLED = "pointer-events-none opacity-40 shadow-none";

const PAGE_LINK =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 font-mono text-sm tabular-nums text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-sm:h-11 max-sm:min-w-11";

const PAGE_CURRENT =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-accent px-3 font-mono text-sm font-medium tabular-nums text-accent-fg shadow-[inset_0_1px_0_0_rgb(255_255_255/0.35)] max-sm:h-11 max-sm:min-w-11";

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
        <Link rel="prev" href={hrefFor(page - 1)} className={NAV_BUTTON}>
          <ChevronLeftIcon className="size-4" />
          Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(NAV_BUTTON, NAV_DISABLED)}>
          <ChevronLeftIcon className="size-4" />
          Previous
        </span>
      )}

      <p className="font-mono text-sm tabular-nums text-muted sm:hidden">
        {page} / {totalPages}
      </p>

      <ol className="hidden items-center gap-1 sm:flex">
        {getPageItems(page, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${index}`} aria-hidden="true" className="px-2 font-mono text-subtle">
              &hellip;
            </li>
          ) : (
            <li key={item}>
              {item === page ? (
                <span aria-current="page" className={PAGE_CURRENT}>
                  {item}
                </span>
              ) : (
                <Link href={hrefFor(item)} aria-label={`Page ${item}`} className={PAGE_LINK}>
                  {item}
                </Link>
              )}
            </li>
          ),
        )}
      </ol>

      {hasNext ? (
        <Link rel="next" href={hrefFor(page + 1)} className={NAV_BUTTON}>
          Next
          <ChevronRightIcon className="size-4" />
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(NAV_BUTTON, NAV_DISABLED)}>
          Next
          <ChevronRightIcon className="size-4" />
        </span>
      )}
    </nav>
  );
}
