// ISR (60 s): community details, members and its latest posts are public and shared by every visitor. Membership
// is a per-user client island, and the join/leave and post routes revalidate this page on demand.
// generateStaticParams returns [] so pages are built on the first request, then cached.
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { CommunityIcon, communityTint } from "@/components/features/community-card";
import { MemberList } from "@/components/features/member-list";
import { JoinCommunityButton } from "@/components/features/join-community-button";
import { PostCard } from "@/components/features/post-card";
import { TopicChips } from "@/components/features/topic-chips";
import { ArrowRightIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { getCommunityBySlug, listCommunityMembers } from "@/lib/data/communities";
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

  const [latest, members] = await Promise.all([
    listPosts({ community: community.slug, limit: 10 }),
    listCommunityMembers(community.id, { limit: 12 }),
  ]);
  // The banner is tinted by the community colour; without a valid one it falls back to the accent.
  const tint = communityTint(community.color) ?? "var(--color-accent)";

  return (
    <article className="flex flex-col gap-12">
      <header className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]">
        <div
          aria-hidden="true"
          className="relative h-32 overflow-hidden sm:h-44"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${tint} 55%, transparent) 0%, color-mix(in srgb, ${tint} 10%, transparent) 60%, transparent 100%), var(--color-surface-2)`,
          }}
        >
          <div className="bg-dots pointer-events-none absolute inset-0 opacity-70" />
        </div>

        <div className="relative flex flex-col gap-6 px-6 pb-8 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div className="-mt-10 flex min-w-0 flex-col gap-5 sm:-mt-12 sm:flex-row sm:items-end">
            <CommunityIcon community={community} slug={community.slug} size="xl" className="ring-4 ring-surface" />
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="font-display text-4xl leading-tight tracking-tight text-fg sm:text-5xl">{community.name}</h1>
              <p className="max-w-2xl text-base leading-7 text-muted">{community.description}</p>
            </div>
          </div>
          <JoinCommunityButton
            communityId={community.id}
            initialMemberCount={community.memberCount}
            className="sm:items-end"
          />
        </div>
      </header>

      {community.topics.length > 0 ? (
        <section aria-labelledby="community-topics" className="flex flex-col gap-3">
          <h2 id="community-topics" className="eyebrow">
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

      <MemberList members={members.items} total={members.total} communityName={community.name} />

      <section aria-labelledby="community-posts" className="flex flex-col gap-6">
        <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
          <h2 id="community-posts" className="font-display text-3xl tracking-tight text-fg">
            Latest posts
          </h2>
          {latest.total > 0 ? (
            <Link
              href={`/blogs?community=${encodeURIComponent(community.slug)}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
            >
              View all
              <ArrowRightIcon aria-hidden="true" className="size-4" />
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
