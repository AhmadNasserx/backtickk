// ISR (60 s): community details and its latest posts are public and shared by every visitor. Membership is a
// per-user client island, and the join/leave and post routes revalidate this page on demand.
// generateStaticParams returns [] so pages are built on the first request, then cached.
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { CommunityIcon } from "@/components/features/community-card";
import { JoinCommunityButton } from "@/components/features/join-community-button";
import { PostCard } from "@/components/features/post-card";
import { TopicChips } from "@/components/features/topic-chips";
import { EmptyState } from "@/components/ui/empty-state";
import { getCommunityBySlug } from "@/lib/data/communities";
import { listPosts } from "@/lib/data/posts";

export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

// Shared by generateMetadata and the page within one request, so the community is read once.
const getCommunity = cache((slug: string) => getCommunityBySlug(slug));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) {
    return { title: "Community not found" };
  }
  return { title: community.name, description: community.description };
}

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) {
    notFound();
  }

  const latest = await listPosts({ community: community.slug, limit: 10 });

  return (
    <article className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
        <div className="flex items-start gap-5">
          <CommunityIcon community={community} size="lg" />
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-fg">{community.name}</h1>
            <p className="max-w-2xl text-muted">{community.description}</p>
          </div>
        </div>
        <JoinCommunityButton
          communityId={community.id}
          initialMemberCount={community.memberCount}
          className="sm:items-end"
        />
      </header>

      {community.topics.length > 0 ? (
        <section aria-labelledby="community-topics" className="flex flex-col gap-3">
          <h2 id="community-topics" className="text-sm font-semibold tracking-wide text-subtle uppercase">
            Topics
          </h2>
          <TopicChips
            topics={community.topics}
            basePath="/blogs"
            searchParams={{ community: community.slug }}
            label="Community topics"
          />
        </section>
      ) : null}

      <section aria-labelledby="community-posts" className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <h2 id="community-posts" className="text-xl font-semibold tracking-tight text-fg">
            Latest posts
          </h2>
          {latest.total > 0 ? (
            <Link
              href={`/blogs?community=${encodeURIComponent(community.slug)}`}
              className="text-sm text-muted transition-colors hover:text-fg"
            >
              View all
            </Link>
          ) : null}
        </div>

        {latest.items.length === 0 ? (
          <EmptyState
            title="No posts yet"
            description={`Nobody has published in ${community.name} yet. Members can share the first post.`}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {latest.items.map((post) => (
              <PostCard key={post.id} post={post} headingLevel="h3" />
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
