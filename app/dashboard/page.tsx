// Dynamic: depends on the signed-in user. Their posts, bookmarks and communities are read per request.
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/features/post-card";
import { DeletePostButton } from "@/components/features/delete-post-button";
import { ProfileCompletion } from "@/components/features/profile-completion";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowRightIcon, BookmarkIcon, EditIcon, EyeIcon, FileTextIcon, PenLineIcon, UsersIcon } from "@/components/ui/icons";
import { TechLogo, communityLogoSlug } from "@/components/ui/tech-logo";
import { requireUserOrRedirect } from "@/lib/auth-helpers";
import { listBookmarks } from "@/lib/data/bookmarks";
import { listUserCommunities } from "@/lib/data/communities";
import { listPostsByAuthor } from "@/lib/data/posts";
import { getUserDTOById } from "@/lib/data/users";
import { formatCount } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

const POSTS_PREVIEW = 10;

// UTC, like formatDate, so the server render is the same no matter where the server runs.
const DATE_LINE = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function revealStyle(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

export default async function DashboardPage() {
  const user = await requireUserOrRedirect("/dashboard");

  // Drafts appear only in the author's own list; the published count leaves them out.
  const [profile, myPosts, publishedPosts, bookmarks, communities] = await Promise.all([
    getUserDTOById(user.id),
    listPostsByAuthor(user.username, { limit: POSTS_PREVIEW, viewer: user }),
    listPostsByAuthor(user.username, { limit: 1 }),
    listBookmarks(user.id, { limit: 1 }),
    listUserCommunities(user.id),
  ]);

  const now = new Date();
  const greeting = greetingFor(now.getUTCHours());
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  const stats = [
    { label: "Published posts", value: publishedPosts.total, Icon: FileTextIcon },
    { label: "Bookmarks", value: bookmarks.total, Icon: BookmarkIcon },
    { label: "Communities", value: communities.length, Icon: UsersIcon },
  ];

  return (
    <div className="flex flex-col gap-10">
      <header className="reveal flex flex-col gap-3" style={revealStyle(0)}>
        <p className="font-mono text-sm text-subtle">{DATE_LINE.format(now)}</p>
        <h1 className="font-display text-4xl leading-tight text-balance text-fg sm:text-5xl">
          {greeting}, <em className="text-accent italic">{firstName}</em>
        </h1>
      </header>

      <ProfileCompletion
        bio={profile?.bio ?? ""}
        skills={profile?.skills ?? []}
        hasJoinedCommunity={communities.length > 0}
        hasPublishedPost={publishedPosts.total > 0}
      />

      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map(({ label, value, Icon }, index) => (
          <div
            key={label}
            className="reveal flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-5"
            style={revealStyle(index + 1)}
          >
            <div className="min-w-0">
              <dt className="truncate text-xs text-muted sm:text-sm">{label}</dt>
              <dd className="mt-1 font-mono text-2xl tabular-nums text-fg sm:text-3xl">{formatCount(value)}</dd>
            </div>
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
            >
              <Icon className="size-4" />
            </span>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
        <section aria-labelledby="my-posts-heading" className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
            <div className="flex items-baseline gap-3">
              <h2 id="my-posts-heading" className="font-display text-2xl text-fg">
                My posts
              </h2>
              <span className="font-mono text-sm text-subtle">{formatCount(myPosts.total)}</span>
            </div>
            {myPosts.total > POSTS_PREVIEW ? (
              <Link
                href={`/profile/${user.username}`}
                className="text-sm text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
              >
                View all on your profile
              </Link>
            ) : null}
          </div>

          {myPosts.items.length === 0 ? (
            <EmptyState
              icon={<FileTextIcon />}
              title="You have not written anything yet"
              description="Share a tutorial, a lesson learned or a question for the community."
              action={
                <Link href="/create" className={buttonClasses("primary", "md")}>
                  Write your first post
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {myPosts.items.map((post) => (
                <li key={post.id} className="cv-auto min-w-0">
                  <PostCard
                    post={post}
                    variant="compact"
                    headingLevel="h3"
                    actions={
                      <>
                        {post.status === "draft" ? (
                          <Badge variant="warning">Draft</Badge>
                        ) : (
                          <Badge variant="success">Published</Badge>
                        )}
                        <Link href={`/blogs/${post.slug}/edit`} className={buttonClasses("secondary", "sm")}>
                          <EditIcon className="size-3.5" />
                          Edit
                          <span className="sr-only">{post.title}</span>
                        </Link>
                        {post.status === "draft" ? (
                          <Link href={`/blogs/${post.slug}/preview`} className={buttonClasses("secondary", "sm")}>
                            <EyeIcon className="size-3.5" />
                            Preview
                            <span className="sr-only">{post.title}</span>
                          </Link>
                        ) : (
                          <Link href={`/blogs/${post.slug}`} className={buttonClasses("secondary", "sm")}>
                            <EyeIcon className="size-3.5" />
                            View
                            <span className="sr-only">{post.title}</span>
                          </Link>
                        )}
                        <DeletePostButton postId={post.id} redirectTo="/dashboard" />
                      </>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside aria-label="Shortcuts and communities" className="flex min-w-0 flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
          <section aria-labelledby="quick-actions-heading" className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]">
            <h2 id="quick-actions-heading" className="eyebrow">
              Quick actions
            </h2>
            <Link href="/create" className={buttonClasses("primary", "md", "w-full")}>
              <PenLineIcon className="size-4" />
              Write a post
            </Link>
            <ul className="flex flex-col">
              <li>
                <Link
                  href="/bookmarks"
                  className="group flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-fg transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <BookmarkIcon className="size-4 text-muted" />
                  <span className="flex-1">Saved posts</span>
                  <ArrowRightIcon className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                </Link>
              </li>
              <li>
                <Link
                  href="/communities"
                  className="group flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-fg transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <UsersIcon className="size-4 text-muted" />
                  <span className="flex-1">Browse communities</span>
                  <ArrowRightIcon className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                </Link>
              </li>
            </ul>
          </section>

          <section aria-labelledby="my-communities-heading" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3 px-1">
              <h2 id="my-communities-heading" className="eyebrow">
                My communities
              </h2>
              <span className="font-mono text-xs text-subtle">{formatCount(communities.length)} joined</span>
            </div>

            {communities.length === 0 ? (
              <EmptyState
                icon={<UsersIcon />}
                title="No communities yet"
                description="Join a community to start publishing in it."
                action={
                  <Link href="/communities" className={buttonClasses("secondary", "md")}>
                    Browse communities
                  </Link>
                }
              />
            ) : (
              <ul className="flex flex-col rounded-2xl border border-line bg-surface p-1.5">
                {communities.map((community) => {
                  const logo = communityLogoSlug(community);
                  return (
                    <li key={community.id}>
                      <Link
                        href={`/communities/${community.slug}`}
                        className="group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        <span
                          aria-hidden="true"
                          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 font-mono text-base font-semibold text-fg"
                          style={
                            community.color
                              ? { backgroundColor: `color-mix(in srgb, ${community.color} 18%, transparent)` }
                              : undefined
                          }
                        >
                          {logo ? <TechLogo slug={logo} className="size-5" /> : community.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-fg group-hover:text-accent">
                            {community.name}
                          </span>
                          <span className="block font-mono text-xs text-subtle">
                            {formatCount(community.memberCount)} members
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <Link href="/communities" className={buttonClasses("ghost", "sm", "self-start")}>
              Explore more communities
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
