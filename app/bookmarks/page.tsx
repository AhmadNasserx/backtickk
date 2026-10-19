// Dynamic: depends on the signed-in user. Their saved posts are read per request, never cached.
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/features/post-card";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BookmarkIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { requireUserOrRedirect } from "@/lib/auth-helpers";
import { listBookmarks } from "@/lib/data/bookmarks";
import { paginationQuerySchema } from "@/schemas/query";

export const metadata: Metadata = {
  title: "Bookmarks",
};

type BookmarksSearchParams = Promise<{ page?: string | string[] }>;

export default async function BookmarksPage({ searchParams }: { searchParams: BookmarksSearchParams }) {
  const user = await requireUserOrRedirect("/bookmarks");
  const params = await searchParams;
  // The schema falls back to defaults for bad input, so this never throws on a malformed URL.
  const query = paginationQuerySchema.parse({ page: Array.isArray(params.page) ? params.page[0] : params.page });
  const result = await listBookmarks(user.id, query);

  return (
    <div className="flex flex-col gap-8">
      <header className="reveal flex flex-col gap-2" style={{ "--i": 0 } as CSSProperties}>
        <p className="eyebrow">
          {result.total === 1 ? "1 saved post" : `${result.total} saved posts`}
        </p>
        <h1 className="font-display text-4xl leading-tight text-fg sm:text-5xl">Bookmarks</h1>
        <p className="text-muted">Posts you saved to read later.</p>
      </header>

      {result.total === 0 ? (
        <EmptyState
          icon={<BookmarkIcon />}
          title="No bookmarks yet"
          description="Use the bookmark button on any post to keep it here."
          action={
            <Link href="/blogs" className={buttonClasses("primary", "md")}>
              Browse blogs
            </Link>
          }
        />
      ) : result.items.length === 0 ? (
        <EmptyState
          title="Nothing on this page"
          description="These bookmarks are on another page, or their posts are no longer published."
          action={
            <Link href="/bookmarks" className={buttonClasses("secondary", "md")}>
              Back to the first page
            </Link>
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {result.items.map((post) => (
              <li key={post.id} className="cv-auto">
                <PostCard post={post} variant="compact" />
              </li>
            ))}
          </ul>
          <Pagination page={result.page} totalPages={result.totalPages} basePath="/bookmarks" />
        </>
      )}
    </div>
  );
}
