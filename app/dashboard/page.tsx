// Dynamic: depends on the signed-in user. Their posts, bookmarks and communities are read per request.
import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/features/post-card";
import { DeletePostButton } from "@/components/features/delete-post-button";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FileTextIcon, UsersIcon } from "@/components/ui/icons";
import { requireUserOrRedirect } from "@/lib/auth-helpers";
import { listBookmarks } from "@/lib/data/bookmarks";
import { listUserCommunities } from "@/lib/data/communities";
import { listPostsByAuthor } from "@/lib/data/posts";
import { formatCount } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

const POSTS_PREVIEW = 10;

export default async function DashboardPage() {
  const user = await requireUserOrRedirect("/dashboard");

  // Drafts appear only in the author's own list; the published count leaves them out.
  const [myPosts, publishedPosts, bookmarks, communities] = await Promise.all([
    listPostsByAuthor(user.username, { limit: POSTS_PREVIEW, viewer: user }),
    listPostsByAuthor(user.username, { limit: 1 }),
    listBookmarks(user.id, { limit: 1 }),
    listUserCommunities(user.id),
  ]);

  const stats = [
    { label: "Published posts", value: publishedPosts.total },
    { label: "Bookmarks", value: bookmarks.total },
    { label: "Communities", value: communities.length },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user.name}</h1>
        </div>
        <Link href="/create" className={buttonClasses("primary", "md")}>
          New post
        </Link>
      </header>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="px-5 py-4">
            <dt className="text-sm text-muted">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{formatCount(stat.value)}</dd>
          </Card>
        ))}
      </dl>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="my-posts-heading" className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="my-posts-heading" className="text-lg font-semibold tracking-tight">
              My posts
            </h2>
            {myPosts.total > POSTS_PREVIEW ? (
              <Link href={`/profile/${user.username}`} className="text-sm text-brand hover:underline">
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
                <li key={post.id}>
                  <PostCard
                    post={post}
                    headingLevel="h3"
                    actions={
                      <>
                        {post.status === "draft" ? <Badge variant="warning">Draft</Badge> : null}
                        <Link href={`/blogs/${post.slug}/edit`} className={buttonClasses("secondary", "sm")}>
                          Edit
                        </Link>
                        <DeletePostButton postId={post.id} redirectTo="/dashboard" />
                      </>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="my-communities-heading" className="flex min-w-0 flex-col gap-4">
          <h2 id="my-communities-heading" className="text-lg font-semibold tracking-tight">
            My communities
          </h2>

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
            <Card>
              <CardHeader>
                <CardTitle as="h3" className="text-sm font-medium text-muted">
                  {communities.length} joined
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 py-2">
                <ul className="flex flex-col">
                  {communities.map((community) => (
                    <li key={community.id}>
                      <Link
                        href={`/communities/${community.slug}`}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                      >
                        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-sm">
                          {community.icon ?? community.name.charAt(0)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-fg">{community.name}</span>
                          <span className="block text-xs text-subtle">
                            {formatCount(community.memberCount)} members
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Link href="/communities" className={buttonClasses("ghost", "sm", "self-start")}>
            Explore more communities
          </Link>
        </section>
      </div>
    </div>
  );
}
