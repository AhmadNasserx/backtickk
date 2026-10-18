// Dynamic (SSR): search, filters and pagination come from search params, so each request is rendered fresh.
import type { Metadata } from "next";
import Link from "next/link";
import { BlogFilters } from "@/components/features/blog-filters";
import { PostCard } from "@/components/features/post-card";
import { SearchBar } from "@/components/features/search-bar";
import { TopicChips } from "@/components/features/topic-chips";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { listAllTopics, listCommunities } from "@/lib/data/communities";
import { listPosts } from "@/lib/data/posts";
import { postsQuerySchema } from "@/schemas/query";

export const metadata: Metadata = {
  title: "Blogs",
  description: "Technical posts from developer communities, searchable by topic, community and author.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">Blogs</h1>
        <p className="text-muted">Practical posts from developer communities.</p>
      </header>

      <div className="flex flex-col gap-4">
        <SearchBar label="Search posts" placeholder="Search by title, excerpt or tag" />
        <BlogFilters communities={communityOptions} />
        <TopicChips
          topics={topics}
          activeTopic={query.topic}
          basePath="/blogs"
          searchParams={filterParams}
          label="Filter posts by topic"
        />
      </div>

      {result.items.length === 0 ? (
        <EmptyState
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
        <div className="flex flex-col gap-4">
          {result.items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <Pagination page={result.page} totalPages={result.totalPages} basePath="/blogs" searchParams={filterParams} />
    </div>
  );
}
