// ISR (60 s): the post and its first comments are public and identical for every visitor. Bookmark, owner and
// comment-author controls are client islands keyed on the session, so this page never reads cookies.
// Comment, edit and delete routes revalidate it on demand. generateStaticParams returns [] (built on first request).
import type { Metadata } from "next";
import Link from "next/link";
import { cache, type CSSProperties } from "react";
import { notFound } from "next/navigation";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { CommentSection } from "@/components/features/comment-section";
import { MarkdownContent } from "@/components/features/markdown-content";
import { PostCard } from "@/components/features/post-card";
import { PostCover } from "@/components/features/post-cover";
import { PostOwnerActions } from "@/components/features/post-owner-actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { listComments } from "@/lib/data/comments";
import { getPostBySlug, listPosts } from "@/lib/data/posts";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

// Shared by generateMetadata and the page within one request, so the post is read once.
const getPost = cache((slug: string) => getPostBySlug(slug));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return { title: "Post not found" };
  }
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: "article", publishedTime: post.publishedAt ?? post.createdAt },
  };
}

const RELATED_SHOWN = 3;

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    notFound();
  }

  // Both reads are public and cacheable with the page; "More in" is skipped for posts without a community.
  const [comments, sameCommunity] = await Promise.all([
    listComments(post.id, { page: 1, limit: 50 }),
    post.community.id ? listPosts({ community: post.community.slug, limit: RELATED_SHOWN + 1 }) : null,
  ]);
  const related = sameCommunity?.items.filter((item) => item.id !== post.id).slice(0, RELATED_SHOWN) ?? [];
  const publishedAt = post.publishedAt ?? post.createdAt;

  return (
    <>
      {/* Reading progress, driven by CSS scroll timeline (see .scroll-progress). Decorative. */}
      <div aria-hidden="true" className="scroll-progress" />

      <article className="mx-auto flex w-full max-w-[44rem] flex-col gap-12">
        <header className="reveal flex flex-col gap-5" style={{ "--i": 0 } as CSSProperties}>
          {post.community.id || post.tags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {post.community.id ? (
                <Link href={`/communities/${post.community.slug}`}>
                  <Badge variant="brand">
                    {post.community.icon ? <span aria-hidden="true">{post.community.icon}</span> : null}
                    {post.community.name}
                  </Badge>
                </Link>
              ) : null}
              {post.tags.length > 0 ? (
                <ul aria-label="Post tags" className="flex min-w-0 flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <li key={tag} className="max-w-full">
                      <Link href={`/blogs?topic=${encodeURIComponent(tag)}`} className="tag">
                        #{tag}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <h1 className="font-display text-[clamp(2.25rem,1.5rem+3vw,3.5rem)] leading-[1.04] tracking-tight text-balance text-fg">
            {post.title}
          </h1>
          <p className="text-lg leading-8 text-pretty text-muted">{post.excerpt}</p>

          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-5">
            {post.author.id ? (
              <Link
                href={`/profile/${encodeURIComponent(post.author.username)}`}
                className="group flex min-w-0 items-center gap-3"
              >
                <Avatar name={post.author.name} src={post.author.image} size="lg" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-fg group-hover:text-accent">{post.author.name}</span>
                  <AuthorMeta username={post.author.username} publishedAt={publishedAt} readingTime={post.readingTime} />
                </span>
              </Link>
            ) : (
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={post.author.name} src={post.author.image} size="lg" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-fg">{post.author.name}</span>
                  <AuthorMeta publishedAt={publishedAt} readingTime={post.readingTime} />
                </span>
              </div>
            )}
            <div className="flex flex-wrap items-start gap-2">
              <BookmarkButton postId={post.id} />
              <PostOwnerActions postId={post.id} slug={post.slug} authorId={post.author.id} />
            </div>
          </div>
        </header>

        <PostCover
          title={post.title}
          community={post.community}
          coverImage={post.coverImage}
          priority
          className="reveal rounded-2xl border border-line"
        />

        <MarkdownContent content={post.content} />

        <CommentSection postId={post.id} postAuthorId={post.author.id} initialComments={comments.items} />

        {post.community.id && related.length > 0 ? (
          <section aria-labelledby="more-in-community" className="flex flex-col gap-5 border-t border-line pt-10">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="more-in-community" className="font-display text-3xl tracking-tight text-fg">
                More in {post.community.name}
              </h2>
              <Link
                href={`/communities/${post.community.slug}`}
                className="font-mono text-xs text-subtle transition-colors hover:text-accent"
              >
                View community
              </Link>
            </div>
            <ul className="flex flex-col gap-3">
              {related.map((item) => (
                <li key={item.id}>
                  <PostCard post={item} variant="compact" headingLevel="h3" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </>
  );
}

function AuthorMeta({
  username,
  publishedAt,
  readingTime,
}: {
  username?: string;
  publishedAt: string;
  readingTime: number;
}) {
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 font-mono text-xs text-subtle">
      {username ? <span className="truncate">@{username}</span> : null}
      {username ? <span aria-hidden="true">·</span> : null}
      <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
      <span aria-hidden="true">·</span>
      <span>{readingTime} min read</span>
    </span>
  );
}
