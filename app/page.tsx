// ISR (60 s): the home page is identical for every visitor and reads only public data, so it is rendered once and
// revalidated each minute. Mutations also revalidate `/` on demand, so the delay is only for reads.
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CommunityCard } from "@/components/features/community-card";
import { PostCard } from "@/components/features/post-card";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowRightIcon, ArrowUpRightIcon } from "@/components/ui/icons";
import { getFeaturedCommunities, getTrendingTopics, listCommunities } from "@/lib/data/communities";
import { getLatestPosts, listPosts } from "@/lib/data/posts";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Explore developer communities",
};

/** Staggers the CSS `.reveal` entrance: each element waits `index` steps (70 ms each). */
function reveal(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

export default async function HomePage() {
  const [communities, posts, trending, communityTotal, postTotal] = await Promise.all([
    getFeaturedCommunities(6),
    getLatestPosts(6),
    getTrendingTopics(10),
    listCommunities({ limit: 1 }).then((result) => result.total),
    listPosts({ limit: 1 }).then((result) => result.total),
  ]);

  const [leadCommunity, ...otherCommunities] = communities;
  const [leadPost, ...otherPosts] = posts;

  return (
    <div className="flex flex-col gap-20">
      <section
        aria-labelledby="home-hero"
        className="relative isolate overflow-hidden rounded-3xl border border-line bg-surface px-6 py-14 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] sm:px-12 sm:py-20"
      >
        <div aria-hidden="true" className="bg-dots pointer-events-none absolute inset-0 -z-10 opacity-70" />
        <div aria-hidden="true" className="bg-glow pointer-events-none absolute -top-48 -right-40 -z-10 size-[36rem]" />

        <div className="relative flex max-w-3xl flex-col gap-7">
          <p className="eyebrow reveal" style={reveal(0)}>
            Developer communities
          </p>
          <h1
            id="home-hero"
            className="reveal font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-tight text-fg"
            style={reveal(1)}
          >
            Explore the{" "}
            <em className="text-accent decoration-accent underline decoration-[3px] underline-offset-[0.14em]">
              communities
            </em>{" "}
            behind your stack.
          </h1>
          <p className="reveal max-w-xl text-lg leading-8 text-muted" style={reveal(2)}>
            Join communities around the tools you use, and read practical posts written by the developers who build with
            them.
          </p>

          <div className="reveal flex flex-wrap gap-3" style={reveal(3)}>
            <Link href="/communities" className={buttonClasses("primary", "lg")}>
              Browse communities
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Link>
            <Link href="/create" className={buttonClasses("secondary", "lg")}>
              Start writing
            </Link>
          </div>

          <dl
            aria-label="Platform totals"
            className="reveal flex w-fit flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-bg/80 px-4 py-3 font-mono text-xs tracking-[0.14em] text-subtle uppercase"
            style={reveal(4)}
          >
            <div className="flex items-baseline gap-2">
              <dt>communities</dt>
              <dd className="text-fg tabular-nums">{communityTotal.toLocaleString("en-US")}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt>posts</dt>
              <dd className="text-fg tabular-nums">{postTotal.toLocaleString("en-US")}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="featured-communities" className="cv-auto flex flex-col gap-8">
        <SectionHeader
          id="featured-communities"
          eyebrow="Most joined"
          title="Featured communities"
          href="/communities"
          linkLabel="View all communities"
        />
        {!leadCommunity ? (
          <EmptyState title="No communities yet" description="Communities will appear here once they are created." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CommunityCard
              community={leadCommunity}
              variant="featured"
              headingLevel="h3"
              className={otherCommunities.length > 0 ? "sm:col-span-2 lg:col-span-2 lg:row-span-2" : "sm:col-span-2 lg:col-span-3"}
            />
            {otherCommunities.map((community) => (
              <CommunityCard key={community.id} community={community} variant="compact" headingLevel="h3" />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="latest-posts" className="cv-auto flex flex-col gap-8">
        <SectionHeader
          id="latest-posts"
          eyebrow="Fresh from the community"
          title="Latest posts"
          href="/blogs"
          linkLabel="View all posts"
        />
        {!leadPost ? (
          <EmptyState title="No posts yet" description="Be the first to publish a post in a community." />
        ) : (
          <div className="flex flex-col gap-4">
            <PostCard post={leadPost} variant="featured" headingLevel="h3" />
            {otherPosts.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {otherPosts.map((post) => (
                  <li key={post.id}>
                    <PostCard post={post} variant="compact" headingLevel="h3" />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </section>

      <section aria-labelledby="trending-topics" className="cv-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2 border-b border-line pb-4">
          <p className="eyebrow">Ranked by published posts</p>
          <h2 id="trending-topics" className="font-display text-3xl tracking-tight text-fg sm:text-4xl">
            Trending topics
          </h2>
        </div>
        {trending.length === 0 ? (
          <EmptyState title="No topics yet" description="Topics appear once posts are tagged." />
        ) : (
          <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {trending.map((item, index) => (
              <li key={item.topic} className="min-w-0 bg-surface">
                <Link
                  href={`/blogs?topic=${encodeURIComponent(item.topic)}`}
                  className="group flex min-w-0 items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2"
                >
                  <span aria-hidden="true" className="shrink-0 font-mono text-xs text-subtle tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 truncate font-mono text-base text-fg transition-colors group-hover:text-accent">
                    #{item.topic}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-xs whitespace-nowrap text-muted tabular-nums">
                    {item.count} {item.count === 1 ? "post" : "posts"}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section
        aria-labelledby="join-band"
        className="relative isolate flex flex-col gap-6 overflow-hidden rounded-3xl border border-line bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12"
      >
        <div aria-hidden="true" className="bg-dots pointer-events-none absolute inset-0 -z-10 opacity-50" />
        <div className="flex max-w-xl flex-col gap-3">
          <h2 id="join-band" className="font-display text-3xl tracking-tight text-fg sm:text-4xl">
            Join the conversation
          </h2>
          <p className="text-base leading-7 text-muted">
            Sign in to join communities, bookmark posts and publish your own writing.
          </p>
        </div>
        <Link href="/signin" className={buttonClasses("primary", "lg", "shrink-0")}>
          Sign in
          <ArrowUpRightIcon aria-hidden="true" className="size-4" />
        </Link>
      </section>
    </div>
  );
}

function SectionHeader({
  id,
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  id: string;
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
      <div className="flex flex-col gap-2">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="font-display text-3xl tracking-tight text-fg sm:text-4xl">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        aria-label={linkLabel}
        className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
      >
        View all
        <ArrowRightIcon aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
}
