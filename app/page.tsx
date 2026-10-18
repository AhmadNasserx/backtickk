// ISR (60 s): the home page is identical for every visitor and reads only public data, so it is rendered once and
// revalidated each minute. Mutations also revalidate `/` on demand, so the delay is only for reads.
import type { Metadata } from "next";
import Link from "next/link";
import { CommunityCard } from "@/components/features/community-card";
import { PostCard } from "@/components/features/post-card";
import { TopicChips } from "@/components/features/topic-chips";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getFeaturedCommunities, getTrendingTopics } from "@/lib/data/communities";
import { getLatestPosts } from "@/lib/data/posts";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Explore developer communities",
};

export default async function HomePage() {
  const [communities, posts, trending] = await Promise.all([
    getFeaturedCommunities(6),
    getLatestPosts(6),
    getTrendingTopics(10),
  ]);

  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface px-6 py-12 sm:px-10">
        <p className="text-sm font-semibold tracking-wide text-brand uppercase">DevCommunity</p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          Explore developer communities
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Join communities around the tools you use, and read practical posts written by the developers who build with them.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/communities" className={buttonClasses("primary", "md")}>
            Browse communities
          </Link>
          <Link href="/create" className={buttonClasses("secondary", "md")}>
            Create a post
          </Link>
        </div>
      </section>

      <section aria-labelledby="featured-communities" className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <h2 id="featured-communities" className="text-xl font-semibold tracking-tight text-fg">
            Featured communities
          </h2>
          <Link href="/communities" className="text-sm text-muted transition-colors hover:text-fg">
            View all
          </Link>
        </div>
        {communities.length === 0 ? (
          <EmptyState title="No communities yet" description="Communities will appear here once they are created." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {communities.map((community) => (
              <CommunityCard key={community.id} community={community} headingLevel="h3" />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="latest-blogs" className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <h2 id="latest-blogs" className="text-xl font-semibold tracking-tight text-fg">
            Latest blogs
          </h2>
          <Link href="/blogs" className="text-sm text-muted transition-colors hover:text-fg">
            View all
          </Link>
        </div>
        {posts.length === 0 ? (
          <EmptyState title="No posts yet" description="Be the first to publish a post in a community." />
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} headingLevel="h3" />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="trending-topics" className="flex flex-col gap-5">
        <h2 id="trending-topics" className="text-xl font-semibold tracking-tight text-fg">
          Trending topics
        </h2>
        {trending.length === 0 ? (
          <EmptyState title="No topics yet" description="Topics appear once posts are tagged." />
        ) : (
          <TopicChips topics={trending.map((item) => item.topic)} basePath="/blogs" label="Trending topics" />
        )}
      </section>
    </div>
  );
}
