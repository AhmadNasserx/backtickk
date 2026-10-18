// ISR (120 s): public profiles and their published posts are the same for every visitor. Profile edits and post
// changes revalidate this page on demand. generateStaticParams returns [] (built on first request).
import type { Metadata } from "next";
import Link from "next/link";
import { cache, type CSSProperties } from "react";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/features/post-card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { listUserCommunities } from "@/lib/data/communities";
import { listPostsByAuthor } from "@/lib/data/posts";
import { getPublicProfileByUsername } from "@/lib/data/users";
import { formatCount } from "@/lib/utils";

export const revalidate = 120;

// Only the newest posts are listed; the profile page has no pagination, so it stays static (no search params).
const POSTS_SHOWN = 20;

const HEX_COLOR = /^#[0-9a-f]{3,8}$/i;

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

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** A deterministic banner per username. The violet range is skipped so banners do not all read as one generic purple. */
function bannerStyle(username: string): CSSProperties {
  let hue = hashString(username) % 360;
  if (hue >= 250 && hue <= 320) hue = (hue + 90) % 360;
  const second = (hue + 45) % 360;
  return {
    backgroundImage: [
      `radial-gradient(60% 90% at 90% 0%, hsl(${second} 85% 60% / 0.35), transparent 70%)`,
      `linear-gradient(135deg, hsl(${hue} 50% 20%) 0%, hsl(${second} 40% 10%) 100%)`,
    ].join(", "),
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
    <div className="flex flex-col gap-14">
      <header className="reveal flex flex-col" style={{ "--i": 0 } as CSSProperties}>
        <div
          aria-hidden="true"
          className="relative h-36 overflow-hidden rounded-2xl border border-line sm:h-48"
          style={bannerStyle(profile.username)}
        >
          <div className="bg-dots absolute inset-0 opacity-50" />
        </div>

        <div className="relative z-10 -mt-12 flex flex-col gap-5 px-1 sm:-mt-16 sm:px-4">
          <Avatar name={profile.name} src={profile.image} size="xl" className="ring-[6px] ring-bg" />

          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="font-display text-4xl leading-tight tracking-tight text-balance text-fg sm:text-5xl">
              {profile.name}
            </h1>
            <p className="font-mono text-sm text-subtle">@{profile.username}</p>
          </div>

          {profile.bio ? (
            <p className="max-w-2xl text-lg leading-8 break-words whitespace-pre-wrap text-pretty text-muted">
              {profile.bio}
            </p>
          ) : null}

          {profile.skills.length > 0 ? (
            <ul aria-label="Skills" className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <li
                  key={skill}
                  className="inline-flex h-8 items-center rounded-full border border-line bg-surface-2 px-3 font-mono text-xs text-muted"
                >
                  {skill}
                </li>
              ))}
            </ul>
          ) : null}

          <dl className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex flex-col gap-1 px-4 py-3.5 sm:px-6">
              <dt className="eyebrow">Posts</dt>
              <dd className="font-display text-3xl text-fg">{formatCount(posts.total)}</dd>
            </div>
            <div className="flex flex-col gap-1 px-4 py-3.5 sm:px-6">
              <dt className="eyebrow">Communities</dt>
              <dd className="font-display text-3xl text-fg">{formatCount(communities.length)}</dd>
            </div>
            <div className="flex flex-col gap-1 px-4 py-3.5 sm:px-6">
              <dt className="eyebrow">Member since</dt>
              <dd className="font-display text-3xl text-fg">{new Date(profile.createdAt).getUTCFullYear()}</dd>
            </div>
          </dl>
        </div>
      </header>

      <section aria-labelledby="profile-communities" className="flex flex-col gap-5">
        <h2 id="profile-communities" className="flex items-baseline gap-3 font-display text-3xl tracking-tight text-fg">
          Communities
          <span className="font-mono text-sm text-subtle">{formatCount(communities.length)}</span>
        </h2>
        {communities.length === 0 ? (
          <EmptyState title="No communities yet" description={`@${profile.username} has not joined any community.`} />
        ) : (
          <ul className="flex flex-wrap gap-2.5">
            {communities.map((community) => {
              const tint = community.color && HEX_COLOR.test(community.color) ? community.color : null;
              return (
                <li key={community.id} className="max-w-full">
                  <Link
                    href={`/communities/${community.slug}`}
                    className="inline-flex h-11 max-w-full items-center gap-2.5 rounded-full border border-line bg-surface py-1 pr-4 pl-1.5 text-sm text-fg transition-colors hover:border-line-strong"
                  >
                    <span
                      aria-hidden="true"
                      style={tint ? { backgroundColor: `color-mix(in srgb, ${tint} 28%, transparent)` } : undefined}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-fg"
                    >
                      {community.icon || community.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 truncate font-medium">{community.name}</span>
                    <span className="font-mono text-xs text-subtle">{formatCount(community.memberCount)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="profile-posts" className="flex flex-col gap-5">
        <h2 id="profile-posts" className="flex items-baseline gap-3 font-display text-3xl tracking-tight text-fg">
          Posts
          <span className="font-mono text-sm text-subtle">{formatCount(posts.total)}</span>
        </h2>
        {posts.items.length === 0 ? (
          <EmptyState title="No published posts yet" description={`@${profile.username} has not published a post.`} />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {posts.items.map((post, index) => (
              <li key={post.id} className={index >= 4 ? "min-w-0 cv-auto" : "min-w-0"}>
                <PostCard post={post} headingLevel="h3" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
