// ISR (120 s): public profiles and their published posts are the same for every visitor. Profile edits and post
// changes revalidate this page on demand. generateStaticParams returns [] (built on first request).
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { CommunityIcon } from "@/components/features/community-card";
import { PostCard } from "@/components/features/post-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { listUserCommunities } from "@/lib/data/communities";
import { listPostsByAuthor } from "@/lib/data/posts";
import { getPublicProfileByUsername } from "@/lib/data/users";
import { formatCount, formatDate } from "@/lib/utils";

export const revalidate = 120;

// Only the newest posts are listed; the profile page has no pagination, so it stays static (no search params).
const POSTS_SHOWN = 20;

export async function generateStaticParams() {
  return [];
}

// Shared by generateMetadata and the page within one request, so the profile is read once.
const getProfile = cache((username: string) => getPublicProfileByUsername(username));

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) {
    return { title: "Profile not found" };
  }
  return {
    title: `${profile.name} (@${profile.username})`,
    description: profile.bio || `Profile of @${profile.username} on DevCommunity.`,
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) {
    notFound();
  }

  const [communities, posts] = await Promise.all([
    listUserCommunities(profile.id),
    listPostsByAuthor(profile.username, { limit: POSTS_SHOWN }),
  ]);

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-start sm:p-8">
        <Avatar name={profile.name} src={profile.image} size="xl" />
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-fg">{profile.name}</h1>
            <p className="text-sm text-subtle">@{profile.username}</p>
          </div>
          {profile.bio ? <p className="max-w-2xl break-words whitespace-pre-wrap text-muted">{profile.bio}</p> : null}
          {profile.skills.length > 0 ? (
            <ul aria-label="Skills" className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <li key={skill}>
                  <Badge>{skill}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-sm text-subtle">
            Joined <time dateTime={profile.createdAt}>{formatDate(profile.createdAt)}</time>
          </p>
        </div>
      </header>

      <section aria-labelledby="profile-communities" className="flex flex-col gap-5">
        <h2 id="profile-communities" className="text-xl font-semibold tracking-tight text-fg">
          Communities
          <span className="ml-2 text-sm font-normal text-subtle">{formatCount(communities.length)}</span>
        </h2>
        {communities.length === 0 ? (
          <EmptyState title="No communities yet" description={`@${profile.username} has not joined any community.`} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {communities.map((community) => (
              <li key={community.id}>
                <Link
                  href={`/communities/${community.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-subtle"
                >
                  <CommunityIcon community={community} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-fg">{community.name}</span>
                    <span className="block text-sm text-subtle">{formatCount(community.memberCount)} members</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="profile-posts" className="flex flex-col gap-5">
        <h2 id="profile-posts" className="text-xl font-semibold tracking-tight text-fg">
          Posts
          <span className="ml-2 text-sm font-normal text-subtle">{formatCount(posts.total)}</span>
        </h2>
        {posts.items.length === 0 ? (
          <EmptyState title="No published posts yet" description={`@${profile.username} has not published a post.`} />
        ) : (
          <div className="flex flex-col gap-4">
            {posts.items.map((post) => (
              <PostCard key={post.id} post={post} headingLevel="h3" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
