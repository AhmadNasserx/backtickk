// Server component: renders post summaries from the data layer, with no client code.
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import type { AuthorRefDTO, PostSummaryDTO } from "@/types";

export type PostCardProps = {
  post: PostSummaryDTO;
  /** Controls shown on the right of the card, e.g. edit or delete buttons on the dashboard. */
  actions?: ReactNode;
  /** Heading level of the title; pages set it so the outline stays in order. */
  headingLevel?: "h2" | "h3";
  className?: string;
};

function AuthorLink({ author }: { author: AuthorRefDTO }) {
  const content = (
    <>
      <span aria-hidden="true" className="inline-flex">
        <Avatar name={author.name} src={author.image} size="sm" />
      </span>
      <span className="truncate">{author.name}</span>
    </>
  );

  if (!author.id) {
    return <span className="inline-flex min-w-0 items-center gap-2 text-sm text-muted">{content}</span>;
  }
  return (
    <Link
      href={`/profile/${encodeURIComponent(author.username)}`}
      className="inline-flex min-w-0 items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
    >
      {content}
    </Link>
  );
}

export function PostCard({ post, actions, headingLevel = "h2", className }: PostCardProps) {
  const Heading = headingLevel;
  // Drafts have no publish date; show when they were created instead.
  const displayedAt = post.publishedAt ?? post.createdAt;

  return (
    <article
      className={cn(
        "flex gap-4 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-subtle sm:p-6",
        className,
      )}
    >
      {post.coverImage ? (
        <div className="hidden shrink-0 sm:block">
          <Image
            src={post.coverImage}
            alt=""
            width={160}
            height={96}
            unoptimized
            className="h-24 w-40 rounded-lg border border-line object-cover"
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
            {post.community.id ? (
              <Link href={`/communities/${post.community.slug}`}>
                <Badge variant="brand">
                  {post.community.icon ? <span aria-hidden="true">{post.community.icon}</span> : null}
                  {post.community.name}
                </Badge>
              </Link>
            ) : null}
            <time dateTime={displayedAt}>{formatDate(displayedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readingTime} min read</span>
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>

        <Heading className="text-lg leading-snug font-semibold tracking-tight text-fg">
          <Link href={`/blogs/${post.slug}`} className="transition-colors hover:text-brand">
            {post.title}
          </Link>
        </Heading>

        <p className="line-clamp-2 text-sm leading-6 text-muted">{post.excerpt}</p>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <AuthorLink author={post.author} />
          {post.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Link href={`/blogs?topic=${encodeURIComponent(tag)}`}>
                    <Badge>{tag}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </article>
  );
}
