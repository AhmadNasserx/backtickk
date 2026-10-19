// Dynamic: drafts are only visible to their author
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/features/markdown-content";
import { PostCover } from "@/components/features/post-cover";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { ArrowUpRightIcon, EditIcon } from "@/components/ui/icons";
import { TechLogo, communityLogoSlug } from "@/components/ui/tech-logo";
import { requireUserOrRedirect } from "@/lib/auth-helpers";
import { getPostBySlug } from "@/lib/data/posts";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Draft preview",
  // A preview is for its author, so keep it out of search indexes.
  robots: { index: false, follow: false },
};

export default async function DraftPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUserOrRedirect(`/blogs/${slug}/preview`);

  // The service returns drafts only to their author and admins, so anyone else gets a 404 here.
  const post = await getPostBySlug(slug, user);
  if (!post) {
    notFound();
  }

  const isDraft = post.status === "draft";
  const canEdit = user.role === "admin" || post.author.id === user.id;
  const logo = communityLogoSlug(post.community);
  const dateTime = post.publishedAt ?? post.createdAt;

  return (
    <article className="mx-auto flex w-full max-w-[44rem] flex-col gap-10">
      {isDraft ? (
        <div className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-medium text-fg">
          Draft preview — only you can see this
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          Preview of a published post
        </div>
      )}

      {canEdit || !isDraft ? (
        <div className="flex flex-wrap items-center gap-3">
          {canEdit ? (
            <Link href={`/blogs/${post.slug}/edit`} className={buttonClasses("secondary", "sm")}>
              <EditIcon aria-hidden="true" className="size-4" />
              Back to edit
            </Link>
          ) : null}
          {!isDraft ? (
            <Link href={`/blogs/${post.slug}`} className={buttonClasses("ghost", "sm")}>
              View public page
              <ArrowUpRightIcon aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
        </div>
      ) : null}

      <header className="flex flex-col gap-5">
        {post.community.id || post.tags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {post.community.id ? (
              <Badge variant="brand">
                {logo ? (
                  <span aria-hidden="true" className="inline-flex">
                    <TechLogo slug={logo} className="size-3.5" />
                  </span>
                ) : null}
                {post.community.name}
              </Badge>
            ) : null}
            {post.tags.length > 0 ? (
              <ul aria-label="Post tags" className="flex min-w-0 flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <li key={tag} className="max-w-full">
                    <span className="tag">#{tag}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <h1 className="font-display text-[clamp(2.25rem,1.5rem+3vw,3.5rem)] leading-[1.04] tracking-tight text-balance text-fg">
          {post.title}
        </h1>
        {post.excerpt ? <p className="text-lg leading-8 text-pretty text-muted">{post.excerpt}</p> : null}

        <div className="flex flex-wrap items-center gap-3 border-y border-line py-5">
          <Avatar name={post.author.name} src={post.author.image} size="lg" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-fg">{post.author.name}</span>
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 font-mono text-xs text-subtle">
              <span>{isDraft ? "Draft" : "Published"}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={dateTime}>{formatDate(dateTime)}</time>
              <span aria-hidden="true">·</span>
              <span>{post.readingTime} min read</span>
            </span>
          </span>
        </div>
      </header>

      <PostCover
        title={post.title}
        community={post.community}
        coverImage={post.coverImage}
        className="rounded-2xl border border-line"
      />

      <MarkdownContent content={post.content} />
    </article>
  );
}
