// ISR (60 s): the post and its first comments are public and identical for every visitor. Bookmark, owner and
// comment-author controls are client islands keyed on the session, so this page never reads cookies.
// Comment, edit and delete routes revalidate it on demand. generateStaticParams returns [] (built on first request).
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { CommentSection } from "@/components/features/comment-section";
import { MarkdownContent } from "@/components/features/markdown-content";
import { PostOwnerActions } from "@/components/features/post-owner-actions";
import { TopicChips } from "@/components/features/topic-chips";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { listComments } from "@/lib/data/comments";
import { getPostBySlug } from "@/lib/data/posts";
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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    notFound();
  }

  const comments = await listComments(post.id, { page: 1, limit: 50 });

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-subtle">
          {post.community.id ? (
            <Link href={`/communities/${post.community.slug}`}>
              <Badge variant="brand">
                {post.community.icon ? <span aria-hidden="true">{post.community.icon}</span> : null}
                {post.community.name}
              </Badge>
            </Link>
          ) : null}
          <time dateTime={post.publishedAt ?? post.createdAt}>{formatDate(post.publishedAt ?? post.createdAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingTime} min read</span>
        </div>

        <h1 className="text-3xl leading-tight font-semibold tracking-tight text-fg sm:text-4xl">{post.title}</h1>
        <p className="text-lg text-muted">{post.excerpt}</p>

        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
          {post.author.id ? (
            <Link
              href={`/profile/${encodeURIComponent(post.author.username)}`}
              className="flex min-w-0 items-center gap-3 transition-colors hover:text-fg"
            >
              <Avatar name={post.author.name} src={post.author.image} size="lg" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-fg">{post.author.name}</span>
                <span className="truncate text-sm text-subtle">@{post.author.username}</span>
              </span>
            </Link>
          ) : (
            <span className="text-sm text-muted">{post.author.name}</span>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <BookmarkButton postId={post.id} />
            <PostOwnerActions postId={post.id} slug={post.slug} authorId={post.author.id} />
          </div>
        </div>
      </header>

      {post.coverImage ? (
        <Image
          src={post.coverImage}
          alt={`Cover image for ${post.title}`}
          width={1200}
          height={630}
          unoptimized
          className="h-auto w-full rounded-xl border border-line"
        />
      ) : null}

      <MarkdownContent content={post.content} />

      {post.tags.length > 0 ? (
        <TopicChips topics={post.tags} basePath="/blogs" label="Post tags" />
      ) : null}

      <CommentSection postId={post.id} postAuthorId={post.author.id} initialComments={comments.items} />
    </article>
  );
}
