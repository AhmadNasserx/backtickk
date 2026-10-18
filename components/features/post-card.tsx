// Server component: renders post summaries from the data layer, with no client code.
// The title link stretches over the whole card (after:inset-0); interactive children sit above it with relative z-10.
import Link from "next/link";
import type { ReactNode } from "react";
import { PostCover } from "@/components/features/post-cover";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import type { AuthorRefDTO, PostSummaryDTO } from "@/types";

export type PostCardVariant = "default" | "featured" | "compact";

export type PostCardProps = {
  post: PostSummaryDTO;
  /** Controls shown on the card, e.g. edit or delete buttons on the dashboard. */
  actions?: ReactNode;
  /** Heading level of the title; pages set it so the outline stays in order. */
  headingLevel?: "h2" | "h3";
  className?: string;
  /** default: cover on top, for grids. featured: large split card for a hero. compact: small cover in a row. */
  variant?: PostCardVariant;
  /** Loads the cover eagerly. Only for an above-the-fold featured card. */
  priority?: boolean;
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
      className="relative z-10 inline-flex min-w-0 items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
    >
      {content}
    </Link>
  );
}

function Meta({ post, displayedAt }: { post: PostSummaryDTO; displayedAt: string }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-xs text-subtle">
      {post.community.id ? (
        <Link href={`/communities/${post.community.slug}`} className="relative z-10">
          <Badge variant="brand">
            {post.community.icon ? <span aria-hidden="true">{post.community.icon}</span> : null}
            {post.community.name}
          </Badge>
        </Link>
      ) : null}
      {/* Drafts have no publish date; show when they were created instead. */}
      <time dateTime={displayedAt}>{formatDate(displayedAt)}</time>
      <span aria-hidden="true">·</span>
      <span>{post.readingTime} min read</span>
    </div>
  );
}

function Tags({ tags, limit }: { tags: string[]; limit?: number }) {
  if (tags.length === 0) return null;
  const shown = limit ? tags.slice(0, limit) : tags;
  return (
    <ul className="relative z-10 flex flex-wrap gap-1.5">
      {shown.map((tag) => (
        <li key={tag}>
          <Link href={`/blogs?topic=${encodeURIComponent(tag)}`} className="tag">
            #{tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Actions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("relative z-10 flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

export function PostCard({
  post,
  actions,
  headingLevel = "h2",
  className,
  variant = "default",
  priority = false,
}: PostCardProps) {
  const Heading = headingLevel;
  const displayedAt = post.publishedAt ?? post.createdAt;
  const titleLink = (
    <Link
      href={`/blogs/${post.slug}`}
      className="transition-colors hover:text-accent after:absolute after:inset-0 after:content-['']"
    >
      {post.title}
    </Link>
  );

  if (variant === "featured") {
    return (
      <article
        className={cn(
          "card-hover group relative grid min-w-0 grid-cols-1 overflow-hidden rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]",
          className,
        )}
      >
        <PostCover
          title={post.title}
          community={post.community}
          coverImage={post.coverImage}
          priority={priority}
          className="border-b border-line md:aspect-auto md:border-r md:border-b-0"
        />
        <div className="flex min-w-0 flex-col gap-5 p-6 sm:p-8 md:p-10">
          <Meta post={post} displayedAt={displayedAt} />
          <Heading className="font-display text-4xl leading-[1.04] text-balance text-fg sm:text-5xl">{titleLink}</Heading>
          <p className="line-clamp-3 text-base leading-7 text-muted sm:text-lg">{post.excerpt}</p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-2">
            <AuthorLink author={post.author} />
            <Tags tags={post.tags} />
          </div>
          {actions ? <Actions>{actions}</Actions> : null}
        </div>
      </article>
    );
  }

  // Compact on phones: the text column fills the row beside the cover, and any actions drop to a line of their own
  // under it. From sm up it is a single row with the actions on the right.
  if (variant === "compact") {
    return (
      <article
        className={cn(
          "card-hover group relative flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-line bg-surface p-3 sm:flex-nowrap sm:gap-5 sm:p-4",
          className,
        )}
      >
        <div className="size-20 shrink-0 overflow-hidden rounded-lg border border-line sm:size-24">
          <PostCover
            title={post.title}
            community={post.community}
            coverImage={post.coverImage}
            className="aspect-auto! h-full w-full"
          />
        </div>
        <div className="flex min-w-0 grow basis-[calc(100%_-_6rem)] flex-col gap-2 sm:basis-0">
          <Meta post={post} displayedAt={displayedAt} />
          <Heading className="line-clamp-2 font-display text-xl leading-snug text-fg">{titleLink}</Heading>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <AuthorLink author={post.author} />
            <Tags tags={post.tags} limit={2} />
          </div>
        </div>
        {actions ? <Actions className="min-w-0 basis-full pl-24 sm:basis-auto sm:pl-0">{actions}</Actions> : null}
      </article>
    );
  }

  return (
    <article
      className={cn(
        "card-hover group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]",
        className,
      )}
    >
      <PostCover
        title={post.title}
        community={post.community}
        coverImage={post.coverImage}
        className="border-b border-line"
      />
      <div className="flex flex-1 flex-col gap-3.5 p-5 sm:p-6">
        <Meta post={post} displayedAt={displayedAt} />
        <Heading className="font-display text-2xl leading-tight text-balance text-fg">{titleLink}</Heading>
        <p className="line-clamp-2 text-sm leading-6 text-muted">{post.excerpt}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-2">
          <AuthorLink author={post.author} />
          <Tags tags={post.tags} />
        </div>
        {actions ? <Actions>{actions}</Actions> : null}
      </div>
    </article>
  );
}
