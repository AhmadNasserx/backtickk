// Dynamic (SSR): search, filters and pagination come from search params, so each request is rendered fresh.
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { BlogFilters } from "@/components/features/blog-filters";
import { PostCard } from "@/components/features/post-card";
import { SearchBar } from "@/components/features/search-bar";
import { TopicChips } from "@/components/features/topic-chips";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { listAllTopics, listCommunities } from "@/lib/data/communities";
import { listPosts } from "@/lib/data/posts";
import { cn } from "@/lib/utils";
import { postsQuerySchema } from "@/schemas/query";

export const metadata: Metadata = {
  title: "Blogs",
  description: "Technical posts from developer communities, searchable by topic, community and author.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Terminal-prompt motif for empty states. Decorative, so hidden from assistive tech. */
function PromptMotif() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="size-12"
    >
      <rect x="6" y="9" width="36" height="30" rx="4" />
      <path d="m14 19 5 4-5 4" />
      <path d="M23 29h11" />
    </svg>
  );
}

export default async function BlogsPage({ searchParams }: { searchParams: SearchParams }) {
  // Invalid values fall back to their defaults inside the schema, so a malformed URL never fails the page.
  const query = postsQuerySchema.parse(await searchParams);
  const [result, communities, topics] = await Promise.all([
    listPosts(query),
    listCommunities({ limit: 50 }),
    listAllTopics(),
  ]);

  const communityOptions = communities.items
    .map((community) => ({ slug: community.slug, name: community.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const filterParams = {
    search: query.search,
    community: query.community,
    topic: query.topic,
    author: query.author,
    sort: query.sort === "oldest" ? "oldest" : undefined,
  };
  const hasFilters = Boolean(query.search || query.community || query.topic || query.author || query.sort === "oldest");

  return (
    <div className="flex flex-col gap-10">
      <header className="reveal flex flex-col gap-3" style={{ "--i": 0 } as CSSProperties}>
        <p className="eyebrow">Journal · Community posts</p>
        <h1 className="font-display text-5xl leading-none tracking-tight text-fg sm:text-6xl">Blogs</h1>
        <p className="max-w-xl text-pretty text-muted">Practical posts from developer communities.</p>
      </header>

      <section aria-label="Find posts" className="reveal flex flex-col gap-4" style={{ "--i": 1 } as CSSProperties}>
        <SearchBar label="Search posts" placeholder="Search by title, excerpt or tag" />
        <TopicChips
          topics={topics}
          activeTopic={query.topic}
          allLabel="All"
          basePath="/blogs"
          searchParams={filterParams}
          label="Filter posts by topic"
        />
        <BlogFilters communities={communityOptions} total={result.total} />
      </section>

      {result.items.length === 0 ? (
        <EmptyState
          icon={<PromptMotif />}
          title={hasFilters ? "No posts match your filters" : "No posts yet"}
          description={
            hasFilters
              ? "Try a different search, or clear the filters to see every post."
              : "Posts will appear here once someone publishes one in a community."
          }
          action={
            hasFilters ? (
              <Link href="/blogs" className={buttonClasses("secondary", "sm")}>
                Clear filters
              </Link>
            ) : (
              <Link href="/communities" className={buttonClasses("secondary", "sm")}>
                Browse communities
              </Link>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          <p className="font-mono text-xs text-subtle">
            {result.total} {result.total === 1 ? "post" : "posts"}
            {result.totalPages > 1 ? ` · page ${result.page} of ${result.totalPages}` : null}
          </p>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {result.items.map((post, index) => (
              // Cards below the first screenfuls skip layout and paint until they scroll near.
              <li key={post.id} className={cn("min-w-0", index >= 4 && "cv-auto")}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <Pagination page={result.page} totalPages={result.totalPages} basePath="/blogs" searchParams={filterParams} />
    </div>
  );
}
