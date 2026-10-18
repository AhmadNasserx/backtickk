// Dynamic (SSR): the list is driven by search params, so every query is rendered on request.
import type { Metadata } from "next";
import Link from "next/link";
import { CommunityCard } from "@/components/features/community-card";
import { SearchBar } from "@/components/features/search-bar";
import { TopicChips } from "@/components/features/topic-chips";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { listAllTopics, listCommunities } from "@/lib/data/communities";
import { communitiesQuerySchema } from "@/schemas/query";

export const metadata: Metadata = {
  title: "Communities",
  description: "Browse developer communities by topic and find the ones worth joining.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CommunitiesPage({ searchParams }: { searchParams: SearchParams }) {
  // The schema falls back to defaults for invalid values, so a malformed URL never fails the page.
  const query = communitiesQuerySchema.parse(await searchParams);
  const [result, topics] = await Promise.all([listCommunities(query), listAllTopics()]);
  const filterParams = { search: query.search, topic: query.topic };
  const hasFilters = Boolean(query.search || query.topic);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">Communities</h1>
        <p className="text-muted">Find developer communities by technology and join the ones you follow.</p>
      </header>

      <div className="flex flex-col gap-4">
        <SearchBar label="Search communities" placeholder="Search by name or description" />
        <TopicChips
          topics={topics}
          activeTopic={query.topic}
          basePath="/communities"
          searchParams={{ search: query.search }}
          label="Filter communities by topic"
        />
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No communities match your filters" : "No communities yet"}
          description={
            hasFilters
              ? "Try a different search term or topic, or clear the filters to see every community."
              : "Communities will appear here once they are created."
          }
          action={
            hasFilters ? (
              <Link href="/communities" className="text-sm font-medium text-brand hover:underline">
                Clear filters
              </Link>
            ) : null
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.items.map((community) => (
            <li key={community.id}>
              <CommunityCard community={community} className="h-full" />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/communities"
        searchParams={filterParams}
      />
    </div>
  );
}
