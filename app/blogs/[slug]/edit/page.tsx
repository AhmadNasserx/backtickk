// Dynamic: depends on the signed-in user. Only the post's author or an admin may edit it.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/forms/post-form";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUserOrRedirect } from "@/lib/auth-helpers";
import { listUserCommunities } from "@/lib/data/communities";
import { getPostBySlug } from "@/lib/data/posts";

export const metadata: Metadata = {
  title: "Edit post",
};

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUserOrRedirect(`/blogs/${slug}/edit`);

  const [post, joined] = await Promise.all([getPostBySlug(slug, user), listUserCommunities(user.id)]);
  if (!post) {
    notFound();
  }

  // The PATCH API enforces the same rule; this check only decides what the page shows.
  if (post.author.id !== user.id && user.role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="You can't edit this post"
          description="Error 403: only the author and site admins can edit this post."
          action={
            <Link href={`/blogs/${post.slug}`} className={buttonClasses("secondary", "md")}>
              Back to the post
            </Link>
          }
        />
      </div>
    );
  }

  // Keeps the post's current community selectable even if the author has since left it.
  const communities = joined.some((community) => community.id === post.community.id)
    ? joined
    : [...joined, post.community].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Edit post</h1>
        <p className="mt-1 text-sm text-muted">Only the fields you change are saved.</p>
      </header>

      <PostForm
        mode="edit"
        communities={communities}
        initial={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          communityId: post.community.id,
          tags: post.tags,
          coverImage: post.coverImage,
          status: post.status,
        }}
      />
    </div>
  );
}
